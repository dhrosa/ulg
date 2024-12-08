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

export function PlayerElement({ player }: { player: Player }) {
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

export function NpcElement({ npc }: { npc: Npc }) {
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
