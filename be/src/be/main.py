import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

import coolname
from fastapi import FastAPI, HTTPException, WebSocket
from fastapi_camelcase import CamelModel
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


class PlayerData(CamelModel):
    name: str


class Player:
    def __init__(self, name: str) -> None:
        self.name = name
        self.socket: WebSocket | None = None

    @property
    def data(self) -> PlayerData:
        return PlayerData(name=self.name)


class GameData(CamelModel):
    id: str
    settings: GameSettings
    players: list[PlayerData] = []


class Game:
    def __init__(self, settings: GameSettings) -> None:
        self.id = coolname.generate_slug(2)
        self.settings = settings
        self.players = list[Player]()

    @property
    def data(self) -> GameData:
        return GameData(
            id=self.id,
            settings=self.settings,
            players=[player.data for player in self.players],
        )


app = FastAPI(root_url="/api", lifespan=lifespan)

games = dict[str, Game]()


@app.get("/game")
async def game_list() -> list[str]:
    return list(games.keys())


@app.get("/game/{game_id}")
async def game_get(game_id: str) -> GameData:
    game = games.get(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return game.data


@app.post("/game")
async def game_new(settings: GameSettings) -> GameData:
    game = Game(settings)
    games[game.data.id] = game
    return game.data


@app.delete("/game/{game_id}")
async def game_delete(game_id: str) -> None:
    game = games.pop(game_id, None)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")


@app.post("/game/{game_id}/player/{name}")
async def player_add(game_id: str, name: str) -> None:
    game = games.get(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")

    for player in game.players:
        if player.name == name:
            raise HTTPException(status_code=409, detail="Player already exists")

    game.players.append(Player(name=name))


@app.delete("/game/{game_id}/player/{name}")
async def player_delete(game_id: str, name: str) -> None:
    game = games.get(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")

    players = [player for player in game.players if player.name != name]
    if len(players) == len(game.players):
        raise HTTPException(status_code=404, detail="Player not found")
    game.players = players


@app.websocket("/game/{game_id}")
async def game_connect(game_id: str, socket: WebSocket) -> None:
    game = games.get(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    await socket.accept()
    await socket.send_json(game.data.model_dump())
    await socket.close()
