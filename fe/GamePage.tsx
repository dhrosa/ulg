import { useParams } from "react-router-dom";
import React from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { Game, GameData, GameContext, PlayerNameContext } from "./Game";
import ClueCandidateEditor from "./ClueCandidateEditor";
import Stands from "./Stands";
import { ClueContextProvider, useClueContext } from "./ClueContext";
import ClueElement from "./ClueElement";
import LoggedOutPage from "./LoggedOutPage";
import { SubmitButton } from "./Form";
import ClueEditor from "./ClueEditor";

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
          <LobbyPhaseSection />
          <VotePhaseSection />
          <CluePhaseSection />
          <GuessPhaseSection />
          <DebugInfo />
        </div>
      </ClueContextProvider>
    </GameContext.Provider>
  );
}

function LobbyPhaseSection() {
  const game = React.useContext(GameContext);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const [error, action, pending] = React.useActionState(async () => {
    const response = await fetch(`${game.url}/start`, { method: "POST" });
    if (response.ok) {
      return null;
    }
    const error = (await response.json()) as ApiError;
    return `Could not start game: ${error.detail}`;
  }, null);
  if (game.phase.name != "lobby") {
    return false;
  }
  const enoughPlayers = game.players.length >= 2;
  return (
    <section className="section">
      <h1 className="title">Lobby Phase</h1>
      {enoughPlayers ? (
        <p>You can start the game now, or wait for more players to join.</p>
      ) : (
        <p>Need more players to join before starting the game.</p>
      )}

      <form action={action}>
        <SubmitButton
          className={pending ? "is-loading" : ""}
          disabled={!enoughPlayers}
        >
          Start Game
        </SubmitButton>
        {error && <p className="help is-danger">{error}</p>}
      </form>
    </section>
  );
}

function VotePhaseSection() {
  const game = React.useContext(GameContext);
  if (game.phase.name != "vote") {
    return false;
  }
  return (
    <section className="section vote-phase">
      <h1 className="title">Vote Phase</h1>
      <div className="block">
        <p>
          Vote for which player will be the clue giver based on their proposed
          clue candidates.
        </p>
        <p>
          The game proceeds to the Clue Phase when the majority players have
          voted for one player.
        </p>
        <p>Propose your own clue candidate below.</p>
      </div>
      <div className="box">
        <h2 className="subtitle">Clue Candidate</h2>
        <ClueCandidateEditor />
      </div>
    </section>
  );
}

function CluePhaseSection() {
  const game = React.useContext(GameContext);
  const playerName = React.useContext(PlayerNameContext);
  if (game.phase.name != "clue") {
    return false;
  }
  const isClueGiver = game.phase.clueGiver === playerName;
  return (
    <section className="section">
      <h1 className="title">Clue Phase</h1>
      {isClueGiver ? (
        <>
          <div className="block">
            <p>
              You are the clue giver. Click on player letters above to spell out
              your clue.
            </p>
          </div>
          <div className="box">
            <h2 className="subtitle">Clue Editor</h2>
            <ClueEditor />
          </div>
        </>
      ) : (
        <p>
          Waiting for player <strong>{game.phase.clueGiver}</strong> to present
          their clue.
        </p>
      )}
    </section>
  );
}

function GuessPhaseSection() {
  const game = React.useContext(GameContext);
  const [, clueDispatch] = useClueContext();
  const currentPlayerName = React.useContext(PlayerNameContext);
  React.useEffect(() => {
    if (game.phase.name == "guess") {
      clueDispatch({ type: "set", tokens: game.phase.clue });
    }
  }, [game]);

  if (game.phase.name != "guess") {
    return false;
  }

  let playerInClue = false;
  for (const token of game.phase.clue) {
    if (token.kind == "player" && token.playerName == currentPlayerName) {
      playerInClue = true;
      break;
    }
  }

  return (
    <section className="section">
      <h1 className="title">Guess Phase</h1>
      <div className="block">
        {playerInClue ? (
          <p>
            You are not a part of the current clue. Waiting for other players to
            decide whether they will stay on their current letter or move on.
          </p>
        ) : (
          <p>
            Given the clue below, decide whether you will stay on your current
            letter or move on.
          </p>
        )}
      </div>
      <div className="box">
        <ClueElement />
      </div>
      <div className="block">
        <button className="button">Move on</button>
        <button className="button">Stay</button>
      </div>
    </section>
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
