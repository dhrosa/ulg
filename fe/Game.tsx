import { createContext } from "react";

export interface Player {
  name: string;
  connected: boolean;
  letter: string;
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
}

export const GameContext = createContext<Game>({} as Game);
export const PlayerNameContext = createContext<string>("");
