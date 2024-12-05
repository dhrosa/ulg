import logging
from collections import Counter
from contextlib import asynccontextmanager
from random import shuffle
from typing import AsyncIterator, Literal, TypeAlias

import coolname
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder
from fastapi_camelcase import CamelModel
from pydantic import Field
from rich.logging import RichHandler

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


class PlayerData(CamelModel):
    name: str
    connected: bool = False
    clue_candidate: ClueCandidate | None = None
    vote: str = ""
    letter: str = "?"


class NpcData(CamelModel):
    name: str
    letter: str
    deck_size: int


class Npc:
    def __init__(self, name: str, letter: str, deck_size: int) -> None:
        self.name = name
        self.letter = letter
        self.deck_size = deck_size

    @property
    def data(self) -> NpcData:
        return NpcData(
            name=self.name,
            letter=self.letter,
            deck_size=self.deck_size,
        )


class Player:
    def __init__(self, name: str) -> None:
        self.name = name
        self.socket: WebSocket | None = None
        self.clue_candidate: ClueCandidate | None = None
        self.letter = "?"
        self.vote = ""

    @property
    def data(self) -> PlayerData:
        return PlayerData(
            name=self.name,
            connected=self.socket is not None,
            clue_candidate=self.clue_candidate,
            vote=self.vote,
            letter=self.letter,
        )


class LobbyPhase(CamelModel):
    name: Literal["lobby"] = "lobby"


class VotePhase(CamelModel):
    name: Literal["vote"] = "vote"


class CluePhase(CamelModel):
    name: Literal["clue"] = "clue"
    clue_giver: str


Phase: TypeAlias = LobbyPhase | VotePhase | CluePhase


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

        self.deck = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
        shuffle(self.deck)

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

    def start(self) -> None:
        # Fill remaining slots with NPCs
        for n in range(6 - len(self.players)):
            self.npcs.append(
                Npc(name=f"NPC {n + 1}", letter=self.deck.pop(), deck_size=5)
            )
        for player in self.players.values():
            player.letter = self.deck.pop()
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
