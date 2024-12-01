from typing import TypeVar

from fastapi.testclient import TestClient

from be.main import Game, GameSettings, app

T = TypeVar("T")

client = TestClient(app)


def new_game(settings: GameSettings = GameSettings(player_word_length=3)) -> Game:
    response = client.post("/game", json=settings.model_dump())
    assert response.status_code == 200
    return Game(**response.json())


def test_new_game() -> None:
    game = new_game(GameSettings(player_word_length=5))
    assert game.id
    assert game.settings.player_word_length == 5


def test_connect() -> None:
    """Websocket connection should return the game state."""
    game = new_game()
    with client.websocket_connect(f"/game/{game.id}") as socket:
        data = socket.receive_json()
        assert Game(**data) == game
