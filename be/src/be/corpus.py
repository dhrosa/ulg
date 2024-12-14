import re
from functools import cache
from pathlib import Path

# Word list from https://www.freescrabbledictionary.com/english-word-list/download/english.txt


@cache
def english() -> list[str]:
    all_lower = re.compile("^[a-z]+$")
    words = set[str]()
    with (Path(__file__).parent / "english.txt").open() as f:
        for line in f:
            word = line.strip()
            if re.match(all_lower, word):
                words.add(word.upper())

    return sorted(words, key=lambda w: (len(w), w))
