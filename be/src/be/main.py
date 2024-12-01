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
    player_word_length: int


class Game(CamelModel):
    id: str
    settings: GameSettings


app = FastAPI(root_url="/api", lifespan=lifespan)

games = dict[str, Game]()


@app.get("/game")
async def game_list() -> list[str]:
    return list(games.keys())


@app.get("/game/{game_id}")
async def game_get(game_id: str) -> Game:
    game = games.get(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@app.post("/game")
async def game_new(settings: GameSettings) -> Game:
    game = Game(
        id=coolname.generate_slug(2),
        settings=settings,
    )
    games[game.id] = game
    return game


@app.delete("/game/{game_id}")
async def game_delete(game_id: str) -> None:
    game = games.pop(game_id, None)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")


@app.websocket("/game/{game_id}")
async def game_connect(game_id: str, socket: WebSocket) -> None:
    game = games.get(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    await socket.accept()
    await socket.send_json(game.model_dump())
    await socket.close()
