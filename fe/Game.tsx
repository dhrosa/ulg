import { createContext } from "react";

export interface ApiError {
  detail: string;
}

export interface ClueCandidate {
  length: number;
  playerCount: number;
  npcCount: number;
  wild: boolean;
}

export interface Player {
  name: string;
  connected: boolean;
  letter: string;
  deckSize: number;
  clueCandidate?: ClueCandidate;
}

export interface Npc {
  name: string;
  letter: string;
  deckSize: number;
}

interface LobbyPhase {
  name: "lobby";
}

interface VotePhase {
  name: "vote";
}

interface CluePhase {
  name: "clue";
}

type Phase = LobbyPhase | VotePhase | CluePhase;

export interface GameData {
  id: string;
  players: Player[];
  npcs: Npc[];
  phase: Phase;
}

export class Game implements GameData {
  id: string;
  players: Player[];
  npcs: Npc[];
  phase: Phase;

  constructor(data: GameData) {
    this.id = data.id;
    this.players = data.players;
    this.npcs = data.npcs;
    this.phase = data.phase;
  }

  get url(): string {
    return `/api/game/${this.id}`;
  }

  playerUrl(name: string): string {
    return `${this.url}/player/${name}`;
  }

  player(name: string): Player {
    return this.players.find((p) => p.name === name) as Player;
  }
}

export const GameContext = createContext<Game>({} as Game);
export const PlayerNameContext = createContext<string>("");
