import { useParams } from "react-router-dom";
import React from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { Field, Label, Control, SubmitButton } from "./Form";
import { toast } from "react-toastify";
import { useLocalStorage } from "react-use";

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

interface Player {
  name: string;
  connected: boolean;
}

interface GameData {
  players: Player[];
}

function ConnectionTag({ connected }: { connected: boolean }) {
  return (
    <span className={`tag ${connected ? "is-success" : "is-danger"}`}>
      {connected ? "Connected" : "Disconnected"}
    </span>
  );
}

function PlayerList({ gameData }: { gameData: GameData }) {
  return (
    <>
      <h3>Players</h3>
      <ul>
        {gameData.players.map((player) => (
          <li key={player.name}>
            <span>{player.name}</span>
            <ConnectionTag connected={player.connected} />
          </li>
        ))}
      </ul>
    </>
  );
}

function LoggedOutPage({
  setPlayerName,
}: {
  setPlayerName: (name: string) => void;
}) {
  const [savedName, setSavedName, _] = useLocalStorage<string>("playerName");
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = data.get("name") as string;
    setSavedName(name);
    setPlayerName(name);
  };
  return (
    <form className="form" onSubmit={onSubmit}>
      <Field>
        <Label>Player name</Label>
        <Control>
          <input
            className="input"
            type="text"
            name="name"
            defaultValue={savedName || ""}
          />
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

  const [initialGameData, setInitialGameData] = React.useState<object | null>(
    null
  );

  const {
    lastJsonMessage: gameData,
    readyState,
  }: { lastJsonMessage: GameData | null; readyState: ReadyState } =
    useWebSocket(`${gameUrl}/player/${playerName}`);

  React.useEffect(() => {
    (async () => {
      const response = await fetch(gameUrl);
      if (!response.ok) {
        console.error(response);
        return;
      }
      const data = await response.json();
      setInitialGameData(data as object);
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

  if (!gameData) {
    return <p>Connecting...</p>;
  }

  return (
    <>
      <section className="section">
        <PlayerList gameData={gameData} />
        <p>
          Socket status: <pre>{readyStateName(readyState)}</pre>
        </p>
        <h3>Live Game Data</h3>
        <pre>{JSON.stringify(gameData, null, 2)}</pre>
        <h3>Initial Game Data</h3>
        <pre>{JSON.stringify(initialGameData, null, 2)}</pre>
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
