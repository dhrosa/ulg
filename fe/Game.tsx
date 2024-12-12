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

export type GuessState = "move_on" | "stay" | "";

export interface Player {
  name: string;
  connected: boolean;
  letter: string;
  deckSize: number;
  clueCandidate?: ClueCandidate;
  vote: string;
  guessState: GuessState;
}

export interface Npc {
  name: string;
  letter: string;
  deckSize: number;
}

export type Token =
  | { kind: "player"; playerName: string }
  | { kind: "npc"; npcName: string }
  | { kind: "wild" };

export type Phase =
  | { name: "lobby" }
  | { name: "vote" }
  | { name: "clue"; clueGiver: string }
  | { name: "guess"; clue: Token[] };

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

  npc(name: string): Npc {
    return this.npcs.find((n) => n.name === name) as Npc;
  }

  tokenLetter(token: Token): string {
    switch (token.kind) {
      case "player":
        return this.player(token.playerName).letter;
      case "npc":
        return this.npc(token.npcName).letter;
      case "wild":
        return "*";
    }
  }
}

export const GameContext = createContext<Game>({} as Game);
export const PlayerNameContext = createContext<string>("");
