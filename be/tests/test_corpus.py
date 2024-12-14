from be.corpus import english


def test_english_corpus() -> None:
    words = english()

    assert len(words) == 76096
    assert "AVOCADO" in words
