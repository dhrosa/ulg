from collections import Counter
from itertools import combinations
from random import shuffle

DEFAULT_DECK = {
    "A": 4,
    "B": 2,
    "C": 3,
    "D": 3,
    "E": 6,
    "F": 2,
    "G": 2,
    "H": 3,
    "I": 4,
    "K": 2,
    "L": 3,
    "M": 2,
    "N": 3,
    "O": 4,
    "P": 2,
    "R": 4,
    "S": 4,
    "T": 4,
    "U": 3,
    "W": 2,
    "Y": 2,
}


def new_deck() -> list[str]:
    deck = list[str]()
    for letter, count in DEFAULT_DECK.items():
        deck.extend([letter] * count)
    shuffle(deck)
    return deck


class NoPossibleCombinationError(ValueError):
    pass


def deal_words(
    deck: list[str], corpus: set[str], num_words: int, word_length: int
) -> list[str]:
    available_letters = Counter[str](deck)

    # Filter corpus down to words of the correct length
    filtered_corpus = [word for word in corpus if len(word) == word_length]
    shuffle(filtered_corpus)

    for words in combinations(filtered_corpus, num_words):
        required_letters = Counter[str]("".join(words))
        if required_letters <= available_letters:
            break
    else:
        raise NoPossibleCombinationError("Could not find a valid combination of words.")

    # Remove the used letters from the deck. O(n^2), but at this scale it's okay.
    to_pop = [letter * count for letter, count in required_letters.items()]
    while to_pop:
        deck.remove(to_pop.pop())
    return list(words)
