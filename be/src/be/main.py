from fastapi import FastAPI
from fastapi_camelcase import CamelModel
import coolname
from pydantic import Field
from typing import Literal


class GameSettings(CamelModel):
    player_count: int
    player_word_length: int


class PendingGame(CamelModel):
    phase: Literal["pending"] = "pending"

    seats: list[str]


class Game(CamelModel):
    id: str
    settings: GameSettings
    state: PendingGame


class NewGameRequest(CamelModel):
    player_count: int
    player_word_length: int


class ClaimSeatRequest(CamelModel):
    seat_index: int
    player_name: str


app = FastAPI(root_url="/api")


@app.get("/player_name")
async def player_name() -> str:
    return " ".join(x.capitalize() for x in coolname.generate(2))


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
        state=PendingGame(
            seats=[""] * settings.player_count,
        ),
    )
    games[game.id] = game
    return game
