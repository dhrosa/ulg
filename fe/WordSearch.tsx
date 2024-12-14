import React from "react";
import { Field, Label, Control, Input } from "./Form";
import { useAsync } from "react-use";
import Symbol from "./Symbol";

function range(length: number) {
  return Array.from({ length }, (_, i) => i);
}

function Pagination({
  page,
  setPage,
  pageCount,
}: {
  page: number;
  setPage: (page: number) => void;
  pageCount: number;
}) {
  if (pageCount == 1) {
    return false;
  }
  return (
    <nav className="pagination is-small is-right block">
      <a
        className={"pagination-previous " + (page === 0 ? "is-disabled" : "")}
        onClick={() => {
          setPage(Math.max(page - 1, 0));
        }}
      >
        <Symbol name="arrow_back" />
      </a>
      <a
        className={
          "pagination-next " + (page === pageCount - 1 ? "is-disabled" : "")
        }
        onClick={() => {
          setPage(Math.min(page + 1, pageCount - 1));
        }}
      >
        <Symbol name="arrow_forward" />
      </a>
      <ul className="pagination-list">
        {range(pageCount).map((i) => (
          <li key={i}>
            <a
              className={"pagination-link " + (i == page ? "is-current" : "")}
              onClick={() => {
                setPage(i);
              }}
            >
              {i + 1}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Results({ results }: { results: string[] }) {
  const wordsPerColumn = 10;
  const wordsPerPage = wordsPerColumn * 5;
  const pageCount = Math.ceil(results.length / wordsPerPage);
  const [page, setPage] = React.useState(0);

  React.useEffect(() => {
    setPage(0);
  }, [results]);

  const resultsPage = results.slice(
    page * wordsPerPage,
    (page + 1) * wordsPerPage
  );
  const columnCount = Math.ceil(resultsPage.length / wordsPerColumn);
  return (
    <>
      <Pagination page={page} setPage={setPage} pageCount={pageCount} />
      <div className="results block">
        <div className="columns">
          {range(columnCount).map((c) => (
            <div key={c} className="column">
              {resultsPage
                .slice(c * wordsPerColumn, (c + 1) * wordsPerColumn)
                .map((word) => (
                  <div key={word}>
                    <span className="length">
                      {word.length.toString().padStart(2, "\xA0")}
                      &nbsp;·&nbsp;
                    </span>
                    <span>{word}</span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
      <Pagination page={page} setPage={setPage} pageCount={pageCount} />
    </>
  );
}

type MatchType = "start" | "middle" | "end";

export default function WordSearch() {
  const {
    loading,
    error,
    value: corpus,
  } = useAsync(async () => {
    const response = await fetch("/api/words");
    if (!response.ok) {
      console.error(response);
      throw new Error("Failed to fetch word list");
    }
    return (await response.json()) as string[];
  });

  const [results, setResults] = React.useState<string[]>([]);
  const [matchType, setMatchType] = React.useState<MatchType>("start");
  const [query, setQuery] = React.useState("");

  const matches = (a: string, b: string): boolean => {
    switch (matchType) {
      case "start":
        return a.startsWith(b);
      case "middle":
        return a.includes(b);
      case "end":
        return a.endsWith(b);
    }
  };

  React.useEffect(() => {
    if (!corpus) {
      return;
    }
    if (!query.length) {
      setResults([]);
      return;
    }
    setResults(corpus.filter((word) => matches(word, query)));
  }, [matchType, query]);

  return (
    <section className="section word-search">
      <h2 className="subtitle">Word Search</h2>

      {loading && (
        <div className="block is-inline-flex is-align-items-center">
          <span className="loader" />
          <span>&nbsp; Loading word list...</span>
        </div>
      )}

      {error && <p className="has-text-danger">{error.message}</p>}

      {corpus && (
        <>
          <form className="form block" action={() => {}}>
            <Field>
              <Label>Match Type</Label>
              <Control>
                {(["start", "middle", "end"] as MatchType[]).map((type) => (
                  <button
                    className={
                      "button " + (matchType == type ? "is-primary" : "")
                    }
                    key={type}
                    onClick={() => {
                      setMatchType(type);
                    }}
                  >
                    {type}
                  </button>
                ))}
              </Control>
            </Field>
            <Field>
              <Control>
                <Input
                  type="text"
                  placeholder="Start typing a word..."
                  value={query}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setQuery(event.target.value.toUpperCase());
                  }}
                />
              </Control>
            </Field>
          </form>
          {results.length > 0 && <Results results={results} />}
        </>
      )}
    </section>
  );
}
