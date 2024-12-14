import React from "react";
import { Field, Control, Input } from "./Form";
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
                  <div key={word}>{word}</div>
                ))}
            </div>
          ))}
        </div>
      </div>
      <Pagination page={page} setPage={setPage} pageCount={pageCount} />
    </>
  );
}

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

  const search = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toUpperCase();
    if (!corpus || !query.length) {
      setResults([]);
      return;
    }

    setResults(corpus.filter((word) => word.startsWith(query)));
  };

  return (
    <section className="section word-search">
      <h2 className="subtitle">Word Lookup Tool</h2>

      {loading && (
        <div className="block is-inline-flex is-align-items-center">
          <span className="loader" />
          <span>&nbsp; Loading word list...</span>
        </div>
      )}

      {error && <p className="has-text-danger">{error.message}</p>}

      {corpus && (
        <>
          <form className="form block">
            <Field>
              <Control>
                <Input
                  type="text"
                  placeholder="Start typing a word..."
                  onChange={search}
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
