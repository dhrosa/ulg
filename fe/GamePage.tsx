import { useParams } from "react-router-dom";
import React from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { Field, Label, Control, SubmitButton } from "./Form";
import { toast } from "react-toastify";
import { useLocalStorage } from "react-use";
import Symbol from "./Symbol";
import {
  Game,
  GameData,
  GameContext,
  Player,
  Npc,
  PlayerNameContext,
  ClueCandidate,
} from "./Game";
import ClueCandidateEditor from "./ClueCandidateEditor";

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

function Tag({
  className,
  ...rest
}: { className?: string } & React.ComponentProps<"div">) {
  return <div className={`tag ${className || ""}`} {...rest} />;
}

function ClueCandidateElement({
  clueCandidate,
}: {
  clueCandidate?: ClueCandidate;
}) {
  if (!clueCandidate) {
    return false;
  }
  return (
    <div className="clue-candidate">
      <span>{clueCandidate.length}</span>
      {clueCandidate.playerCount > 0 && (
        <span>-{clueCandidate.playerCount}P</span>
      )}
      {clueCandidate.npcCount > 0 && <span>-{clueCandidate.npcCount}N</span>}
      {clueCandidate.wild && <span>-*</span>}
    </div>
  );
}

function VoteButton({ player }: { player: Player }) {
  const game = React.useContext(GameContext);
  const currentPlayerName = React.useContext(PlayerNameContext);
  const currentPlayer = game.player(currentPlayerName);

  if (game.phase.name != "vote" || !player.clueCandidate) {
    return false;
  }
  const voted = currentPlayer.vote == player.name;
  const onClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const url = `${game.playerUrl(currentPlayerName)}/vote`;
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote: voted ? "" : player.name }),
    });
    if (response.ok) {
      return;
    }
    toast.error("Failed to cast vote.");
    console.error(response);
  };

  let voteCount = 0;
  for (const p of game.players) {
    if (p.vote == player.name) {
      voteCount++;
    }
  }

  return (
    <button className={`button ${voted ? "is-primary" : ""}`} onClick={onClick}>
      {voteCount}
      <Symbol name="thumb_up" />
    </button>
  );
}

function PlayerElement({ player }: { player: Player }) {
  return (
    <div className="player card">
      <header className="card-header">
        <div className="card-header-title">{player.name}</div>
      </header>
      <div className="card-content">
        <div className="tags">
          {player.connected ? (
            <Tag className="is-success">
              <Symbol name="wifi" />
            </Tag>
          ) : (
            <Tag className="is-warning">
              <Symbol name="wifi_off" />
            </Tag>
          )}
        </div>
        <div className="letter">
          <div>{player.letter}</div>
        </div>
        <ClueCandidateElement clueCandidate={player.clueCandidate} />
        <VoteButton player={player} />
      </div>
    </div>
  );
}

function NpcElement({ npc }: { npc: Npc }) {
  return (
    <div className="player card">
      <header className="card-header">
        <div className="card-header-title">{npc.name}</div>
      </header>
      <div className="card-content">
        <div className="tags">
          <Tag>
            <Symbol name="smart_toy" />
          </Tag>
        </div>
        <div className="letter">
          <div>{npc.letter}</div>
        </div>
      </div>
    </div>
  );
}

function Players() {
  const game = React.useContext(GameContext);
  return (
    <section className="section players">
      {game.players.map((player) => (
        <PlayerElement key={player.name} player={player} />
      ))}
      {game.npcs.map((npc) => (
        <NpcElement key={npc.name} npc={npc} />
      ))}
    </section>
  );
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
      <div className="game-page container is-fluid">
        <GameInfo connectionStatus={readyStateName(readyState)} />
        <Players />
        <StartGameButton />
        <ClueCandidateEditor />
        <DebugInfo />
      </div>
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
