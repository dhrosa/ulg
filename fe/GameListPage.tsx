import React from "react";
import { Link } from "react-router-dom";

export default function GameListPage() {
  const [gameIds, setGameIds] = React.useState<string[] | null>(null);
  React.useEffect(() => {
    const get = async () => {
      const response = await fetch("/api/game");
      setGameIds(await response.json());
    };
    get().catch((error: unknown) => {
      console.error(error);
    });
  }, []);
  if (gameIds === null) {
    return <p>Loading...</p>;
  }
  if (gameIds.length === 0) {
    return <p>No games found.</p>;
  }
  return (
    <ul>
      {gameIds.map((g) => (
        <li key={g}>
          <Link to={`/${g}`}>{g}</Link>
        </li>
      ))}
    </ul>
  );
}
