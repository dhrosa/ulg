from typing import TypeVar, cast

from fastapi.testclient import TestClient
from pytest import raises
from starlette.websockets import WebSocketDisconnect

from be.main import GameData, GameSettings, PlayerData, app

T = TypeVar("T")

client = TestClient(app)


def new_game(settings: GameSettings = GameSettings(player_word_length=3)) -> GameData:
    response = client.post("/game", json=settings.model_dump())
    assert response.status_code == 200
    return GameData(**response.json())


def get_game(game_id: str) -> GameData:
    response = client.get(f"/game/{game_id}")
    assert response.status_code == 200
    return GameData(**response.json())


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

    response = client.get(f"/game/{game.id}")
    assert response.status_code == 200
    assert GameData(**response.json()) == game


def test_delete_existing_game() -> None:
    """Delete game and check that it is no longer listed."""
    game = new_game()
    response = client.delete(f"/game/{game.id}")
    assert response.status_code == 200

    assert game.id not in list_games()

    response = client.get(f"/game/{game.id}")
    assert response.status_code == 404


def test_delete_nonexistent_game() -> None:
    """Delete game that does not exist."""
    response = client.delete("/game/nonexistent-game-id")
    assert response.status_code == 404


def test_add_player() -> None:
    """Add player and check that it exists."""
    game = new_game()
    response = client.post(f"/game/{game.id}/player/A")
    assert response.status_code == 200

    assert PlayerData(name="A") in get_game(game.id).players


def test_add_duplicate_player() -> None:
    """Add player that already exists."""
    game = new_game()
    response = client.post(f"/game/{game.id}/player/A")
    assert response.status_code == 200
    assert [p.name for p in get_game(game.id).players] == ["A"]

    response = client.post(f"/game/{game.id}/player/A")
    assert response.status_code == 409
    assert [p.name for p in get_game(game.id).players] == ["A"]


def test_delete_player() -> None:
    """Delete player and check that it is no longer listed."""
    game = new_game()
    client.post(f"/game/{game.id}/player/A")
    response = client.delete(f"/game/{game.id}/player/A")
    assert response.status_code == 200

    assert get_game(game.id).players == []


def test_delete_nonexistent_player() -> None:
    """Delete player  that does not exist."""
    game = new_game()
    response = client.delete(f"/game/{game.id}/player/A")
    assert response.status_code == 404


def test_connect() -> None:
    """Websocket connection should return the game state."""
    game = new_game()
    with client.websocket_connect(f"/game/{game.id}") as socket:
        data = socket.receive_json()
        assert GameData(**data) == game


def test_connect_nonexistent_game() -> None:
    """Websocket connection to nonexistent game should fail."""
    with raises(WebSocketDisconnect) as e:
        with client.websocket_connect("/game/nonexistent-game-id"):
            pass

    assert e.value.status_code == 404  # type: ignore
