import csv
import re
from functools import cache
from pathlib import Path

# Word list from https://www.eapfoundation.com/vocab/general/bnccoca/


@cache
def english() -> list[str]:
    pattern = re.compile(r"[a-z]+")
    words = set[str]()
    with (Path(__file__).parent / "bnc_coca.csv").open() as f:
        reader = csv.reader(f)
        for row in reader:
            for form in pattern.findall(row[2]):
                words.add(form.upper())

    return sorted(words, key=lambda w: (len(w), w))
