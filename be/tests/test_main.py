from typing import TypeVar, cast

from fastapi.testclient import TestClient
from pytest import raises
from starlette.websockets import WebSocketDisconnect

from be.main import Game, GameSettings, app

T = TypeVar("T")

client = TestClient(app)


def new_game(settings: GameSettings = GameSettings(player_word_length=3)) -> Game:
    response = client.post("/game", json=settings.model_dump())
    assert response.status_code == 200
    return Game(**response.json())


def list_games() -> list[str]:
    response = client.get("/game")
    assert response.status_code == 200
    return cast(list[str], response.json())


def test_new_game() -> None:
    """Create game and check that it exists."""
    game = new_game(GameSettings(player_word_length=5))
    assert game.id
    assert game.settings.player_word_length == 5

    assert game.id in list_games()


def test_delete_existing_game() -> None:
    """Delete game and check that it is no longer listed."""
    game = new_game()
    response = client.delete(f"/game/{game.id}")
    assert response.status_code == 200

    assert game.id not in list_games()


def test_delete_nonexistent_game() -> None:
    """Delete game that does not exist."""
    response = client.delete("/game/nonexistent-game-id")
    assert response.status_code == 404


def test_connect() -> None:
    """Websocket connection should return the game state."""
    game = new_game()
    with client.websocket_connect(f"/game/{game.id}") as socket:
        data = socket.receive_json()
        assert Game(**data) == game


def test_connect_nonexistent_game() -> None:
    """Websocket connection to nonexistent game should fail."""
    with raises(WebSocketDisconnect) as e:
        with client.websocket_connect("/game/nonexistent-game-id"):
            pass

    assert e.value.status_code == 404  # type: ignore
