import {
  Player,
  Npc,
  GameContext,
  PlayerNameContext,
  ClueCandidate,
  Token,
} from "./Game";
import React from "react";
import { toast } from "react-toastify";
import Symbol from "./Symbol";
import { useClueContext } from "./ClueContext";
import Letter from "./Letter";
import { motion } from "motion/react";
import Tag from "./Tag";
import NumberToken from "./NumberToken";

function ClueCandidateElement({
  clueCandidate,
}: {
  clueCandidate: ClueCandidate;
}) {
  const c = clueCandidate;
  return (
    <div className="clue-candidate">
      <span className="value">{c.length}</span>
      <span>C</span>

      <span>-</span>
      <span className="value">{c.playerCount}</span>
      <span>P</span>

      <span>-</span>
      <span className="value">{c.npcCount}</span>
      <span>N</span>

      {c.wild && (
        <>
          <span>-</span>
          <span className="value">*</span>
        </>
      )}
    </div>
  );
}

type Stand =
  | { kind: "player"; player: Player }
  | { kind: "npc"; npc: Npc }
  | { kind: "wild" };

function standName(stand: Stand) {
  switch (stand.kind) {
    case "player":
      return stand.player.name;
    case "npc":
      return stand.npc.name;
    case "wild":
      return "wild";
  }
}

function standLetter(stand: Stand) {
  switch (stand.kind) {
    case "player":
      return stand.player.letter;
    case "npc":
      return stand.npc.letter;
    case "wild":
      return "*";
  }
}

function tokenMatchesStand(token: Token, stand: Stand) {
  if (stand.kind == "player" && token.kind == "player") {
    return token.playerName == stand.player.name;
  }
  if (stand.kind == "npc" && token.kind == "npc") {
    return token.npcName == stand.npc.name;
  }
  return stand.kind == "wild" && token.kind == "wild";
}

function VoteFooter({ stand }: { stand: Stand }) {
  const game = React.useContext(GameContext);
  const currentPlayerName = React.useContext(PlayerNameContext);
  const currentPlayer = game.player(currentPlayerName);

  if (stand.kind != "player") {
    return false;
  }
  const player = stand.player;

  let voteCount = 0;
  for (const p of game.players) {
    if (p.vote == player.name) {
      voteCount++;
    }
  }

  const vote = async (target: string) => {
    const response = await fetch(`${game.playerUrl(currentPlayerName)}/vote`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote: target }),
    });
    if (!response.ok) {
      toast.error("Failed to cast vote.");
      console.error(response);
      return;
    }
  };

  const voted = currentPlayer.vote == player.name;
  return (
    <footer className="card-footer">
      <button
        className={"card-footer-item button " + (voted ? "is-primary" : "")}
        onClick={() => vote(voted ? "" : player.name)}
      >
        <Symbol name="thumb_up" />
      </button>
      <div className="card-footer-item is-flex is-flex-direction-column">
        {player.clueCandidate && (
          <ClueCandidateElement clueCandidate={player.clueCandidate} />
        )}
        <div>{voteCount}&nbsp;votes</div>
      </div>
      <button className="card-footer-item button" onClick={() => vote("")}>
        <Symbol name="thumb_down" />
      </button>
    </footer>
  );
}

function ClueFooter({ stand }: { stand: Stand }) {
  const [clue] = useClueContext();
  const tokenNumbers = [];
  for (const [index, token] of clue.entries()) {
    if (tokenMatchesStand(token, stand)) {
      tokenNumbers.push(index + 1);
      continue;
    }
  }
  return (
    <footer className="card-footer">
      <div className="card-footer-item">
        <div className="tags tokens">
          {tokenNumbers.map((n) => (
            <NumberToken n={n} key={n} />
          ))}
        </div>
      </div>
    </footer>
  );
}

function ConnectionTag({ stand }: { stand: Stand }) {
  const currentPlayerName = React.useContext(PlayerNameContext);
  if (stand.kind == "npc" || stand.kind == "wild") {
    return (
      <Tag title="Non-player character">
        <Symbol name="smart_toy" />
      </Tag>
    );
  }
  const player = stand.player;
  if (player.name == currentPlayerName) {
    return (
      <Tag className="is-primary">
        <Symbol name="star" />
      </Tag>
    );
  }
  if (player.connected) {
    return (
      <Tag className="is-success" title="Player is online">
        <Symbol name="wifi" />
      </Tag>
    );
  }
  return (
    <Tag className="is-warning" title="Player is offline">
      <Symbol name="wifi_off" />
    </Tag>
  );
}

function StandLetter({ stand }: { stand: Stand }) {
  const game = React.useContext(GameContext);
  const currentPlayerName = React.useContext(PlayerNameContext);
  const [, clueDispatch] = useClueContext();

  if (stand.kind == "player" && stand.player.name == currentPlayerName) {
    return <Letter letter="_" />;
  }
  const letter = <Letter letter={standLetter(stand)} />;
  if (game.phase.name != "clue") {
    return letter;
  }
  if (game.phase.clueGiver != currentPlayerName) {
    return letter;
  }
  if (stand.kind == "player" && stand.player.name == currentPlayerName) {
    // Can't add yourself to a clue.
    return letter;
  }
  const token = (): Token => {
    switch (stand.kind) {
      case "player":
        return { kind: "player", playerName: stand.player.name };
      case "npc":
        return { kind: "npc", npcName: stand.npc.name };
      case "wild":
        return { kind: "wild" };
    }
  };
  return (
    <motion.a
      whileHover={{ scale: 1.2 }}
      onClick={() => {
        clueDispatch({ type: "add", token: token() });
      }}
    >
      {letter}
    </motion.a>
  );
}

function StandElement({ stand }: { stand: Stand }) {
  const game = React.useContext(GameContext);
  return (
    <div className="stand card">
      <header className="card-header">
        <div className="card-header-title">
          <span>{standName(stand)}&nbsp;</span>
          <ConnectionTag stand={stand} />
        </div>
      </header>
      <div className="card-content">
        <StandLetter stand={stand} />
      </div>
      {game.phase.name == "vote" && <VoteFooter stand={stand} />}
      {(game.phase.name == "clue" || game.phase.name == "guess") && (
        <ClueFooter stand={stand} />
      )}
    </div>
  );
}

export default function Stands() {
  const game = React.useContext(GameContext);
  return (
    <section className="section stands">
      {game.players.map((player) => (
        <StandElement key={player.name} stand={{ kind: "player", player }} />
      ))}
      {game.npcs.map((npc) => (
        <StandElement key={npc.name} stand={{ kind: "npc", npc }} />
      ))}
      {game.phase.name != "lobby" && <StandElement stand={{ kind: "wild" }} />}
    </section>
  );
}
