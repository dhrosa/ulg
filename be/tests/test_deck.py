from random import shuffle

from pytest import raises

from be.deck import NoPossibleCombinationError, deal_words, new_deck


def test_deck_size() -> None:
    assert len(new_deck()) == 64


def test_deal_words_pops_deck() -> None:
    deck = list("CATDOGXYZCAR")
    shuffle(deck)
    corpus = {"CAT", "DOG", "BAT"}
    assert set(deal_words(deck, corpus, num_words=2, word_length=3)) == {"CAT", "DOG"}

    assert set(deck) == set("XYZCAR")


def test_deal_words_impossible_combination() -> None:
    deck = list("ABCDEFG")
    shuffle(deck)
    corpus = {"CAT", "DOG"}

    with raises(NoPossibleCombinationError):
        deal_words(deck, corpus, num_words=2, word_length=3)
