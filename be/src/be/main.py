import logging
from collections import Counter
from contextlib import asynccontextmanager
from random import shuffle
from typing import Annotated, AsyncIterator, Literal, TypeAlias

import coolname
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder
from fastapi_camelcase import CamelModel
from pydantic import Field
from rich.logging import RichHandler

from .corpus import english
from .deck import deal_words, new_deck

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    logging.basicConfig(
        level="INFO",
        format="%(message)s",
        datefmt="[%X]",
        handlers=[RichHandler(rich_tracebacks=True)],
    )
    yield


class GameSettings(CamelModel):
    """Game settings configured at the start of the game."""

    player_word_length: int


class ClueCandidate(CamelModel):
    length: int
    player_count: int
    npc_count: int
    wild: bool


class TokenOnWild(CamelModel):
    kind: Literal["wild"] = "wild"


class TokenOnPlayer(CamelModel):
    kind: Literal["player"] = "player"
    player_name: str


class TokenOnNpc(CamelModel):
    kind: Literal["npc"] = "npc"
    npc_name: str


Token: TypeAlias = Annotated[
    TokenOnWild | TokenOnPlayer | TokenOnNpc, Field(discriminator="kind")
]


Clue: TypeAlias = list[Token]

GuessState: TypeAlias = Literal["move_on", "stay", ""]


class PlayerData(CamelModel):
    name: str
    connected: bool = False
    clue_candidate: ClueCandidate | None = None
    vote: str = ""
    letter: str = "?"
    deck_size: int = 0
    guess_state: GuessState = ""


class NpcData(CamelModel):
    name: str
    letter: str
    deck_size: int


class Npc:
    def __init__(self, name: str) -> None:
        self.name = name
        self.letter = "?"
        self.secret_deck = list[str]()

    @property
    def data(self) -> NpcData:
        return NpcData(
            name=self.name,
            letter=self.letter,
            deck_size=len(self.secret_deck),
        )


class Player:
    def __init__(self, name: str) -> None:
        self.name = name
        self.socket: WebSocket | None = None
        self.clue_candidate: ClueCandidate | None = None
        self.letter = "?"
        self.vote = ""
        self.secret_word: str = ""
        self.secret_deck = list[str]()
        self.guess_state: GuessState = ""

    @property
    def data(self) -> PlayerData:
        return PlayerData(
            name=self.name,
            connected=self.socket is not None,
            clue_candidate=self.clue_candidate,
            vote=self.vote,
            letter=self.letter,
            guess_state=self.guess_state,
        )


class LobbyPhase(CamelModel):
    name: Literal["lobby"] = "lobby"


class VotePhase(CamelModel):
    name: Literal["vote"] = "vote"


class CluePhase(CamelModel):
    name: Literal["clue"] = "clue"
    clue_giver: str


class GuessPhase(CamelModel):
    name: Literal["guess"] = "guess"
    clue: Clue


Phase: TypeAlias = LobbyPhase | VotePhase | CluePhase | GuessPhase


class GameData(CamelModel):
    id: str
    settings: GameSettings
    players: list[PlayerData] = []
    npcs: list[NpcData] = []
    phase: Phase = Field(discriminator="name")


class Game:
    def __init__(self, settings: GameSettings) -> None:
        self.id = coolname.generate_slug(2)
        self.settings = settings
        self.players = dict[str, Player]()
        self.npcs = list[Npc]()
        self.phase: Phase = LobbyPhase()
        self.deck = new_deck()

    @property
    def data(self) -> GameData:
        return GameData(
            id=self.id,
            settings=self.settings,
            players=[player.data for player in self.players.values()],
            npcs=[npc.data for npc in self.npcs],
            phase=self.phase,
        )

    async def broadcast(self) -> None:
        logger.info("Broadcasting game data.")
        for player in self.players.values():
            if player.socket is None:
                continue
            try:
                await player.socket.send_json(
                    jsonable_encoder(self.data, exclude_none=True)
                )
            except WebSocketDisconnect:
                logger.info("Skipping player %s due to disconnection", player.name)

    def top_vote(self) -> str:
        vote_counts = Counter[str](player.vote for player in self.players.values())
        top_vote, count = vote_counts.most_common()[0]
        quorum = len(self.players) // 2 + 1
        if count >= quorum:
            return top_vote
        return ""

    def _deal_secret_words(self) -> None:
        secret_words = deal_words(
            self.deck,
            english(),
            num_words=len(self.players),
            word_length=self.settings.player_word_length,
        )
        for player, word in zip(self.players.values(), secret_words):
            player.secret_word = word
            player.secret_deck = list(word)
            shuffle(player.secret_deck)
            player.letter = player.secret_deck.pop()
            logger.info(f"Secret word for player {player.name}: {word}")

    def _add_npcs(self) -> None:
        for i in range(6 - len(self.players)):
            npc = Npc(f"NPC {i + 1}")
            self.npcs.append(npc)
            # 1st NPC gets 7 cards, 2nd NPC gets 8 cards, ...
            npc.secret_deck = [self.deck.pop() for _ in range(7 + i)]
            npc.letter = npc.secret_deck.pop()

    def start(self) -> None:
        self._deal_secret_words()
        self._add_npcs()
        self.phase = VotePhase()

    def maybe_finish_guess_phase(self) -> None:
        assert isinstance(self.phase, GuessPhase)
        undecided_player_names = set[str]()
        for token in self.phase.clue:
            if isinstance(token, TokenOnPlayer):
                undecided_player_names.add(token.player_name)

        for player in self.players.values():
            if player.guess_state:
                undecided_player_names.discard(player.name)

        if undecided_player_names:
            return

        # Next round
        for player in self.players.values():
            player.guess_state = ""
            player.vote = ""
        self.phase = VotePhase()


app = FastAPI(root_url="/api", lifespan=lifespan)

games = dict[str, Game]()


def game_or_404(game_id: str) -> Game:
    try:
        return games[game_id]
    except KeyError:
        raise HTTPException(status_code=404, detail="Game not found")


def game_and_player_or_404(game_id: str, name: str) -> tuple[Game, Player]:
    game = game_or_404(game_id)
    try:
        return game, game.players[name]
    except KeyError:
        raise HTTPException(status_code=404, detail="Player not found")


@app.get("/game")
async def game_list() -> list[str]:
    return list(games.keys())


@app.get("/game/{game_id}")
async def game_get(game_id: str) -> GameData:
    return game_or_404(game_id).data


@app.post("/game")
async def game_new(settings: GameSettings) -> GameData:
    game = Game(settings)
    games[game.data.id] = game
    return game.data


@app.delete("/game/{game_id}")
async def game_delete(game_id: str) -> None:
    try:
        del games[game_id]
    except KeyError:
        raise HTTPException(status_code=404, detail="Game not found")


@app.post("/game/{game_id}/player/{name}")
async def player_add(game_id: str, name: str) -> None:
    game = game_or_404(game_id)
    if name in game.players:
        raise HTTPException(status_code=409, detail="Player already exists")
    game.players[name] = Player(name=name)
    await game.broadcast()


@app.delete("/game/{game_id}/player/{name}")
async def player_delete(game_id: str, name: str) -> None:
    game = game_or_404(game_id)
    try:
        del game.players[name]
    except KeyError:
        raise HTTPException(status_code=404, detail="Player not found")
    await game.broadcast()


@app.put("/game/{game_id}/player/{name}/clue_candidate")
async def player_set_clue_candidate(
    game_id: str, name: str, candidate: ClueCandidate
) -> None:
    game, player = game_and_player_or_404(game_id, name)
    player.clue_candidate = candidate
    await game.broadcast()


@app.delete("/game/{game_id}/player/{name}/clue_candidate")
async def player_delete_clue_candidate(game_id: str, name: str) -> None:
    game, player = game_and_player_or_404(game_id, name)
    player.clue_candidate = None
    await game.broadcast()


class VoteRequest(CamelModel):
    vote: str


@app.put("/game/{game_id}/player/{name}/vote")
async def player_vote(game_id: str, name: str, request: VoteRequest) -> None:
    game, player = game_and_player_or_404(game_id, name)
    player.vote = request.vote
    if top_vote := game.top_vote():
        logger.info("%s selected as clue giver", top_vote)
        game.phase = CluePhase(clue_giver=top_vote)
    await game.broadcast()


@app.websocket("/game/{game_id}/player/{name}")
async def game_connect(game_id: str, name: str, socket: WebSocket) -> None:
    game, player = game_and_player_or_404(game_id, name)
    logger.info("Player connected: %s", name)
    try:
        await socket.accept()
        player.socket = socket
        await game.broadcast()
        await socket.receive_json()
    except WebSocketDisconnect as e:
        logger.info(f"Player disconnected: {name}, reason: {e}")
    finally:
        player.socket = None
        await game.broadcast()


@app.post("/game/{game_id}/start")
async def game_start(game_id: str) -> None:
    game = game_or_404(game_id)
    for player in game.players.values():
        if player.socket is None:
            raise HTTPException(
                status_code=409, detail=f"Player {player.name} is not connected"
            )

    game.start()
    await game.broadcast()


@app.put("/game/{game_id}/clue")
async def game_set_clue(game_id: str, clue: Clue) -> None:
    game = game_or_404(game_id)
    if not isinstance(game.phase, CluePhase):
        raise HTTPException(status_code=409, detail="Game is not in clue phase")
    game.phase = GuessPhase(clue=clue)
    # Instant transition is possible if no players are in the clue
    game.maybe_finish_guess_phase()
    await game.broadcast()


class GuessStateRequest(CamelModel):
    guess_state: GuessState


@app.put("/game/{game_id}/player/{name}/guess_state")
async def player_set_guess_state(
    game_id: str, name: str, request: GuessStateRequest
) -> None:
    game, player = game_and_player_or_404(game_id, name)
    if not isinstance(game.phase, GuessPhase):
        raise HTTPException(status_code=409, detail="Game is not in guess phase")
    player.guess_state = request.guess_state
    game.maybe_finish_guess_phase()
    await game.broadcast()
