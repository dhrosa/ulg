import { useParams } from "react-router-dom";
import React from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

function readyStateName(readyState: ReadyState) {
  switch (readyState) {
    case ReadyState.CONNECTING:
      return "Connecting";
    case ReadyState.OPEN:
      return "Open";
    case ReadyState.CLOSING:
      return "Closing";
    case ReadyState.CLOSED:
      return "Closed";
    case ReadyState.UNINSTANTIATED:
      return "Uninstantiated";
    default:
      return "Unknown";
  }
}

export default function GamePage() {
  let { gameId } = useParams<{ gameId: string }>();
  gameId ??= "unknown";
  const gameUrl = `/api/game/${gameId}`;

  const [gameData, setGameData] = React.useState<object | null>(null);

  const { lastJsonMessage, readyState } = useWebSocket(`${gameUrl}/player/A`);

  React.useEffect(() => {
    (async () => {
      const response = await fetch(gameUrl);
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
        <p>
          Socket status: <pre>{readyStateName(readyState)}</pre>
        </p>
        <h3>WebSocket message</h3>
        <pre>{JSON.stringify(lastJsonMessage, null, 2)}</pre>
        <h3>Raw Data</h3>
        <pre>{JSON.stringify(gameData, null, 2)}</pre>
      </section>
    </>
  );
}
