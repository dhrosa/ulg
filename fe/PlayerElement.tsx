import {
  Player,
  Npc,
  GameContext,
  PlayerNameContext,
  ClueCandidate,
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
  clueCandidate?: ClueCandidate;
}) {
  if (!clueCandidate) {
    return false;
  }
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

function VoteFooter({ player }: { player: Player }) {
  const game = React.useContext(GameContext);
  const currentPlayerName = React.useContext(PlayerNameContext);
  const currentPlayer = game.player(currentPlayerName);

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
        <ClueCandidateElement clueCandidate={player.clueCandidate} />
        <div>{voteCount}&nbsp;votes</div>
      </div>
      <button className="card-footer-item button" onClick={() => vote("")}>
        <Symbol name="thumb_down" />
      </button>
    </footer>
  );
}

function ClueFooter({ player }: { player: Player }) {
  const game = React.useContext(GameContext);
  const [clue] = useClueContext();
  if (game.phase.name != "clue") {
    return false;
  }
  const tokenNumbers = [];
  for (const [index, token] of clue.entries()) {
    if (token.kind == "player" && token.playerName == player.name) {
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

function ConnectionTag({ player }: { player: Player }) {
  const currentPlayerName = React.useContext(PlayerNameContext);
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

function ClickableLetter({ player }: { player: Player }) {
  const [, clueDispatch] = useClueContext();
  return (
    <motion.a
      whileHover={{ scale: 1.2 }}
      onClick={() => {
        clueDispatch({
          type: "add",
          token: { kind: "player", playerName: player.name },
        });
      }}
    >
      <Letter letter={player.letter} />
    </motion.a>
  );
}

export function PlayerElement({ player }: { player: Player }) {
  const game = React.useContext(GameContext);
  const currentPlayerName = React.useContext(PlayerNameContext);
  const isClueGiver =
    game.phase.name == "clue" && game.phase.clueGiver == currentPlayerName;
  return (
    <div className="player card">
      <header className="card-header">
        <div className="card-header-title">
          <span>{player.name}&nbsp;</span>
          <ConnectionTag player={player} />
        </div>
      </header>
      <div className="card-content">
        {isClueGiver && player.name != currentPlayerName ? (
          <ClickableLetter player={player} />
        ) : (
          <Letter letter={player.letter} />
        )}
      </div>
      {game.phase.name == "vote" && <VoteFooter player={player} />}
      {game.phase.name == "clue" && <ClueFooter player={player} />}
    </div>
  );
}

export function NpcElement({ npc }: { npc: Npc }) {
  return (
    <div className="player card">
      <header className="card-header">
        <div className="card-header-title">
          <span>{npc.name}&nbsp;</span>
          <Tag title="Non-player character">
            <Symbol name="smart_toy" />
          </Tag>
        </div>
      </header>
      <div className="card-content">
        <Letter letter={npc.letter} />
      </div>
    </div>
  );
}

export function Players() {
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
