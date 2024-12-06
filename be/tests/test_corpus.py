from be.corpus import english


def test_english_corpus() -> None:
    words = english()
    assert "AVOCADO" in words

    # Proper noun
    assert "TUESDAY" not in words
    # Hyphen
    assert "X-RAY" not in words
