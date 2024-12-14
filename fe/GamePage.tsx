import { useParams } from "react-router-dom";
import React from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { Game, GameData, GameContext, PlayerNameContext } from "./Game";
import Stands from "./Stands";
import { ClueContextProvider } from "./ClueContext";
import LoggedOutPage from "./LoggedOutPage";
import PhaseSection from "./PhaseSection";
import Symbol from "./Symbol";
import { useCopyToClipboard } from "react-use";
import WordSearch from "./WordSearch";

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

function GameInfo({ connectionStatus }: { connectionStatus: string }) {
  const game = React.useContext(GameContext);

  const [, copyToClipboard] = useCopyToClipboard();

  const items = {
    "Game ID": (
      <>
        {game.id}
        &nbsp;
        <button
          className="button is-small"
          title="Copy link"
          onClick={() => {
            copyToClipboard(window.location.href);
          }}
        >
          <Symbol name="content_copy" />
        </button>
      </>
    ),
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
          <Stands />
          <PhaseSection />
          <WordSearch />
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
