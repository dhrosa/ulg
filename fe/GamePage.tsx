import { useParams } from "react-router-dom";
import React from "react";

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [gameData, setGameData] = React.useState<object | null>(null);
  React.useEffect(() => {
    (async () => {
      const response = await fetch(`/api/game/${gameId ?? "unknown"}`);
      if (!response.ok) {
        console.error(response);
        return;
      }
      const data = await response.json();
      setGameData(data as object);
    })().catch((error: unknown) => {
      console.error(error);
    });
  }, []);

  if (gameData === null) {
    return <p>Loading...</p>;
  }
  return (
    <>
      <section className="section">
        <h3>Raw Data</h3>
        <pre>{JSON.stringify(gameData, null, 2)}</pre>
      </section>
    </>
  );
}
