import React from "react";
import { GameContext, PlayerNameContext, GuessState } from "./Game";
import { useClueContext } from "./ClueContext";
import ClueCandidateEditor from "./ClueCandidateEditor";
import ClueElement from "./ClueElement";
import { SubmitButton } from "./Form";
import ClueEditor from "./ClueEditor";

interface ApiError {
  detail: string;
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
  let haveAnyCandidates = false;
  for (const player of game.players) {
    if (player.clueCandidate) {
      haveAnyCandidates = true;
      break;
    }
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
        {haveAnyCandidates || (
          <p className="has-text-warning">
            No players have proposed any clue candidates yet.
          </p>
        )}

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
  const [error, setError] = React.useState<string | null>(null);
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

  const setGuessState = async (guessState: GuessState) => {
    const response = await fetch(
      `${game.playerUrl(currentPlayerName)}/guess_state`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guessState }),
      }
    );
    if (response.ok) {
      return;
    }
    setError("Could not submit guess decision.");
    console.error(response);
  };

  return (
    <section className="section">
      <h1 className="title">Guess Phase</h1>
      <div className="block">
        {playerInClue ? (
          <p>
            Given the clue below, decide whether you will stay on your current
            letter or move on.
          </p>
        ) : (
          <p>
            You are not a part of the current clue. Waiting for other players to
            decide whether they will stay on their current letter or move on.
          </p>
        )}
      </div>
      <div className="box">
        <h2 className="subtitle">Clue</h2>
        <ClueElement />
      </div>
      {playerInClue && (
        <div className="block">
          <button
            className="button"
            onClick={async () => {
              await setGuessState("move_on");
            }}
          >
            Move on
          </button>
          <button
            className="button"
            onClick={async () => {
              await setGuessState("stay");
            }}
          >
            Stay
          </button>
          {error && <p className="help is-danger">{error}</p>}
        </div>
      )}
    </section>
  );
}

export default function PhaseSection() {
  return (
    <>
      <LobbyPhaseSection />
      <VotePhaseSection />
      <CluePhaseSection />
      <GuessPhaseSection />
    </>
  );
}
