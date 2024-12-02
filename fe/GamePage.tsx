import { useParams } from "react-router-dom";
import React from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [gameData, setGameData] = React.useState<object | null>(null);

  const { lastJsonMessage, readyState } = useWebSocket(
    `/api/game/${gameId ?? "unknown"}/player/A`
  );

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];
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
  console.log("Message:", lastJsonMessage);
  console.log("Connection status: ", connectionStatus);
  if (gameData === null) {
    return <p>Loading...</p>;
  }
  return (
    <>
      <section className="section container">
        <p>
          Socket status: <pre>{connectionStatus}</pre>
        </p>
        <h3>WebSocket message</h3>
        <pre>{JSON.stringify(lastJsonMessage, null, 2)}</pre>
        <h3>Raw Data</h3>
        <pre>{JSON.stringify(gameData, null, 2)}</pre>
      </section>
    </>
  );
}
