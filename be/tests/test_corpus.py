from be.corpus import english


def test_english_corpus() -> None:
    words = english()

    # Output of: grep -E "^[a-z]+$" english.txt | wc -l

    assert len(words) == 62461
    assert "AVOCADO" in words

    # Proper noun
    assert "TUESDAY" not in words
    # Hyphen
    assert "X-RAY" not in words
