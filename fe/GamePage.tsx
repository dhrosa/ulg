import { useParams } from "react-router-dom";
import React from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { Field, Label, Control, SubmitButton } from "./Form";
import { toast } from "react-toastify";

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

function LoggedOutPage({
  setPlayerName,
}: {
  setPlayerName: (name: string) => void;
}) {
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPlayerName(data.get("name") as string);
  };
  return (
    <form className="form" onSubmit={onSubmit}>
      <Field>
        <Label>Player name</Label>
        <Control>
          <input className="input" type="text" name="name" />
        </Control>
      </Field>
      <SubmitButton>Join Game</SubmitButton>
    </form>
  );
}

function LoggedInPage({
  gameId,
  playerName,
}: {
  gameId: string;
  playerName: string;
}) {
  const gameUrl = `/api/game/${gameId}`;

  const [gameData, setGameData] = React.useState<object | null>(null);

  const { lastJsonMessage, readyState } = useWebSocket(
    `${gameUrl}/player/${playerName}`
  );

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

  React.useEffect(() => {
    (async () => {
      const response = await fetch(`${gameUrl}/player/${playerName}`, {
        method: "POST",
        body: "{}",
      });
      if (response.ok) {
        toast("Joining as new player.");
      } else if (response.status === 409) {
        toast("Joining as existing player.");
      } else {
        toast("Failed to join game.");
        console.error(response);
        return;
      }
    })().catch((error: unknown) => {
      console.error(error);
    });
  }, [playerName]);

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

export default function GamePage() {
  let { gameId } = useParams<{ gameId: string }>();
  gameId ??= "unknown";

  const [playerName, setPlayerName] = React.useState<string | null>(null);
  if (playerName === null) {
    return <LoggedOutPage setPlayerName={setPlayerName} />;
  }
  return <LoggedInPage gameId={gameId} playerName={playerName} />;
}
