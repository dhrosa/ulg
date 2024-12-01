from fastapi.testclient import TestClient

from be.main import Game, GameSettings, app

client = TestClient(app)


def test_new_game() -> None:
    response = client.post(
        "/game", json=GameSettings(player_word_length=5).model_dump()
    )
    assert response.status_code == 200
    game = Game(**response.json())
    assert game.id
    assert game.settings.player_word_length == 5
