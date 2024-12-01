from typing import TypeVar, cast

from fastapi.testclient import TestClient
from pytest import raises
from starlette.websockets import WebSocketDisconnect

from be.main import (
    ClueCandidate,
    CluePhase,
    GameData,
    GameSettings,
    LobbyPhase,
    PlayerData,
    VotePhase,
    app,
)

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


def add_player(game_id: str, name: str) -> None:
    assert client.post(f"/game/{game_id}/player/{name}").status_code == 200


def test_new_game() -> None:
    """Create game and check that it exists."""
    game = new_game(GameSettings(player_word_length=5))
    assert game.id
    assert game.settings.player_word_length == 5
    assert isinstance(game.phase, LobbyPhase)

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
    """"""
    game = new_game()
    add_player(game.id, "A")
    assert get_game(game.id).players == [PlayerData(name="A", connected=False)]
    with client.websocket_connect(f"/game/{game.id}/player/A"):
        assert get_game(game.id).players == [PlayerData(name="A", connected=True)]
    assert get_game(game.id).players == [PlayerData(name="A", connected=False)]


def test_connect_nonexistent_game() -> None:
    """Connection to nonexistent game should fail."""
    with raises(WebSocketDisconnect) as e:
        with client.websocket_connect("/game/nonexistent-game-id/player/A"):
            pass

    assert e.value.status_code == 404  # type: ignore


def test_connect_nonexistent_player() -> None:
    """Connection to nonexistent player should fail."""
    game = new_game()
    with raises(WebSocketDisconnect) as e:
        with client.websocket_connect(f"/game/{game.id}/player/nonexistent-player"):
            pass

    assert e.value.status_code == 404  # type: ignore


def test_start_game_disconnected_player() -> None:
    """Starting game with a disconnected player should fail."""
    game = new_game()
    add_player(game.id, "A")
    add_player(game.id, "B")
    with client.websocket_connect(f"/game/{game.id}/player/A"):
        response = client.post(f"/game/{game.id}/start")
    assert response.status_code == 409


def test_start_game() -> None:
    game = new_game()
    add_player(game.id, "A")
    add_player(game.id, "B")

    assert isinstance(get_game(game.id).phase, LobbyPhase)

    with (
        client.websocket_connect(f"/game/{game.id}/player/A"),
        client.websocket_connect(f"/game/{game.id}/player/B"),
    ):
        assert client.post(f"/game/{game.id}/start").status_code == 200
        assert isinstance(get_game(game.id).phase, VotePhase)


def test_clue_candidate() -> None:
    game = new_game()
    add_player(game.id, "A")
    add_player(game.id, "B")

    with (
        client.websocket_connect(f"/game/{game.id}/player/A"),
        client.websocket_connect(f"/game/{game.id}/player/B"),
    ):
        assert client.post(f"/game/{game.id}/start").status_code == 200

        candidate = ClueCandidate(length=5, player_count=1, npc_count=3, wild=True)
        assert (
            client.put(
                f"/game/{game.id}/player/A/clue_candidate",
                json=candidate.model_dump(),
            ).status_code
            == 200
        )

        assert get_game(game.id).players[0].clue_candidate == candidate

        assert (
            client.delete(f"/game/{game.id}/player/A/clue_candidate").status_code == 200
        )

        assert get_game(game.id).players[0].clue_candidate is None


def test_vote() -> None:
    game = new_game()
    add_player(game.id, "A")
    add_player(game.id, "B")

    with (
        client.websocket_connect(f"/game/{game.id}/player/A"),
        client.websocket_connect(f"/game/{game.id}/player/B"),
    ):
        assert client.post(f"/game/{game.id}/start").status_code == 200
        assert [p.vote for p in get_game(game.id).players] == ["", ""]
        assert isinstance(get_game(game.id).phase, VotePhase)

        assert (
            client.put(f"/game/{game.id}/player/A/vote", json={"vote": "B"}).status_code
            == 200
        )
        assert [p.vote for p in get_game(game.id).players] == ["B", ""]
        assert isinstance(get_game(game.id).phase, VotePhase)

        assert (
            client.put(f"/game/{game.id}/player/B/vote", json={"vote": "B"}).status_code
            == 200
        )
        assert [p.vote for p in get_game(game.id).players] == ["B", "B"]

        clue_phase = get_game(game.id).phase
        assert isinstance(clue_phase, CluePhase)
        assert clue_phase.clue_giver == "B"
