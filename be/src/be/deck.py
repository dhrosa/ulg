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
