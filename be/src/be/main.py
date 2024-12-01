from fastapi import FastAPI, WebSocket
from fastapi_camelcase import CamelModel
import coolname
from pydantic import Field
from typing import Literal
import logging
from contextlib import asynccontextmanager

from rich.logging import RichHandler

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
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

@app.get("/")
async def root() -> str:
    logger.info("hi")
    return "test"

@app.post("/game")
async def game_new(settings: GameSettings) -> Game:
    game = Game(
        id=coolname.generate_slug(2),
        settings=settings,
    )
    games[game.id] = game
    return game


@app.websocket("/socket")
async def socket_test(socket: WebSocket):
    await socket.accept()
    logger.info("Accepted socket")
    while True:
        data = await socket.receive_text()
        logger.info("Received:", data)
        await socket.send_text(f"Echo: {data}")
