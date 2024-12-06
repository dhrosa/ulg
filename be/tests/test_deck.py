from be.deck import new_deck


def test_deck_size() -> None:
    assert len(new_deck()) == 64
