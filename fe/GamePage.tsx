import { useParams } from "react-router-dom";
import React from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { Field, Label, Control, SubmitButton } from "./Form";
import { toast } from "react-toastify";
import { useLocalStorage } from "react-use";
import { Game, GameData, GameContext, PlayerNameContext } from "./Game";
import ClueCandidateEditor from "./ClueCandidateEditor";
import { Players } from "./PlayerElement";
import { ClueContextProvider } from "./ClueContext";

function readyStateName(readyState: ReadyState) {
  switch (readyState) {
    case ReadyState.CONNECTING:
      return "connecting";
    case ReadyState.OPEN:
      return "open";
    case ReadyState.CLOSING:
      return "closing";
    case ReadyState.CLOSED:
      return "closed";
    case ReadyState.UNINSTANTIATED:
      return "uninstantiated";
    default:
      return "unknown";
  }
}

function LoadedPage() {
  const [playerName, setPlayerName] = React.useState<string | null>();
  if (!playerName) {
    return <LoggedOutPage setPlayerName={setPlayerName} />;
  }
  return (
    <PlayerNameContext.Provider value={playerName}>
      <LoggedInPage />
    </PlayerNameContext.Provider>
  );
}

function LoggedOutPage({
  setPlayerName,
}: {
  setPlayerName: (name: string) => void;
}) {
  const game = React.useContext(GameContext);
  const [savedName, setSavedName] = useLocalStorage<string>("playerName");
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = data.get("name") as string;
    (async () => {
      const response = await fetch(game.playerUrl(name), {
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
      setSavedName(name);
      setPlayerName(name);
    })().catch((error: unknown) => {
      console.error(error);
    });
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
            autoFocus
          />
        </Control>
      </Field>
      <SubmitButton>Join Game</SubmitButton>
    </form>
  );
}

function GameInfo({ connectionStatus }: { connectionStatus: string }) {
  const game = React.useContext(GameContext);
  const items = {
    "Game ID": game.id,
    "Connection Status": connectionStatus,
    Phase: game.phase.name,
    Players: game.players.length,
    NPCs: 6 - game.players.length,
  };
  return (
    <nav className="level">
      {Object.entries(items).map(([label, value]) => (
        <div key={label} className="level-item has-text-centered">
          <div>
            <p className="heading">{label}</p>
            <p className="title">{value}</p>
          </div>
        </div>
      ))}
    </nav>
  );
}

interface ApiError {
  detail: string;
}

function StartGameButton() {
  const game = React.useContext(GameContext);
  if (game.phase.name != "lobby") {
    return false;
  }
  const onClick = async () => {
    const response = await fetch(`${game.url}/start`, { method: "POST" });
    if (response.ok) {
      toast.success("Game started!");
      return;
    }
    const error = (await response.json()) as ApiError;
    if (response.status === 409) {
      toast.error(`Could not start game: ${error.detail}`);
      return;
    }
  };
  return (
    <SubmitButton
      className="is-fullwidth is-large"
      disabled={game.players.length < 2}
      onClick={onClick}
    >
      Start Game
    </SubmitButton>
  );
}

function DebugInfo() {
  const game = React.useContext(GameContext);
  return (
    <section className="section">
      <h3>Live Game Data</h3>
      <pre>{JSON.stringify(game, null, 2)}</pre>
    </section>
  );
}

function LoggedInPage() {
  const initialGame = React.useContext(GameContext);
  const playerName = React.useContext(PlayerNameContext);
  const {
    lastJsonMessage: gameData,
    readyState,
  }: { lastJsonMessage: GameData | null; readyState: ReadyState } =
    useWebSocket(initialGame.playerUrl(playerName));

  if (!gameData) {
    return <p>Connecting...</p>;
  }
  const game = new Game(gameData);

  return (
    <GameContext.Provider value={game}>
      <ClueContextProvider>
        <div className="game-page container is-fluid">
          <GameInfo connectionStatus={readyStateName(readyState)} />
          <Players />
          <StartGameButton />
          <ClueCandidateEditor />
          <DebugInfo />
        </div>
      </ClueContextProvider>
    </GameContext.Provider>
  );
}

export default function GamePage() {
  let { gameId } = useParams<{ gameId: string }>();
  gameId ??= "unknown";

  const [game, setGame] = React.useState<undefined | null | Game>(undefined);

  React.useEffect(() => {
    (async () => {
      const response = await fetch(`/api/game/${gameId}`);
      if (response.status === 404) {
        setGame(null);
        return;
      }
      if (!response.ok) {
        console.error(response);
        return;
      }
      const data = await response.json();
      setGame(new Game(data as GameData));
    })().catch((error: unknown) => {
      console.error(error);
    });
  }, []);
  if (game === undefined) {
    return <p>Loading game...</p>;
  }
  if (game === null) {
    return <p>Game not found.</p>;
  }
  return (
    <GameContext.Provider value={game}>
      <LoadedPage />
    </GameContext.Provider>
  );
}
