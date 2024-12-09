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
  const currentPlayerName = React.useContext(PlayerNameContext);
  const [clue, clueDispatch] = useClueContext();
  if (game.phase.name != "clue") {
    return false;
  }
  if (game.phase.clueGiver != currentPlayerName) {
    return false;
  }
  if (player.name == currentPlayerName) {
    return false;
  }
  const appendToClue = () => {
    clueDispatch({
      type: "add",
      token: { kind: "player", playerName: player.name },
    });
  };
  const tokenNumbers = [];
  for (const [index, token] of clue.entries()) {
    if (token.kind == "player" && token.playerName == player.name) {
      tokenNumbers.push(index + 1);
      continue;
    }
  }
  const color = (n: number) => {
    const hslColors = [
      "0 100% 84%",
      "33 100% 84%",
      "62 100% 86%",
      "110 100% 87%",
      "185 100% 80%",
      "217 100% 81%",
      "249 100% 85%",
      "300 100% 89%",
    ];
    return `hsl(${hslColors[(n - 1) % hslColors.length]})`;
  };
  return (
    <footer className="card-footer">
      <div className="card-footer-item">
        <div className="tags">
          {tokenNumbers.map((n) => (
            <Tag
              key={n}
              className="token is-rounded"
              style={{
                backgroundColor: color(n),
              }}
            >
              {n}
            </Tag>
          ))}
          <a href="#" onClick={appendToClue}>
            <Tag>+</Tag>
          </a>
        </div>
      </div>
    </footer>
  );
}

export function PlayerElement({ player }: { player: Player }) {
  const game = React.useContext(GameContext);
  const currentPlayerName = React.useContext(PlayerNameContext);
  let connectionTag;
  if (player.name == currentPlayerName) {
    connectionTag = (
      <Tag>
        <Symbol name="star" />
      </Tag>
    );
  } else {
    connectionTag = player.connected ? (
      <Tag className="is-success" title="Player is online">
        <Symbol name="wifi" />
      </Tag>
    ) : (
      <Tag className="is-warning" title="Player is offline">
        <Symbol name="wifi_off" />
      </Tag>
    );
  }
  return (
    <div className="player card">
      <header className="card-header">
        <div className="card-header-title">
          <span>{player.name}&nbsp;</span>
          {connectionTag}
        </div>
      </header>
      <div className="card-content">
        <div className="letter">
          <div>{player.letter}</div>
        </div>
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
        <div className="letter">
          <div>{npc.letter}</div>
        </div>
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
