import { createContext } from "react";

export interface Player {
  name: string;
  connected: boolean;
}

export interface GameData {
  id: string;
  players: Player[];
}

export class Game implements GameData {
  id: string;
  players: Player[];

  constructor(data: GameData) {
    this.id = data.id;
    this.players = data.players;
  }

  get url(): string {
    return `/api/game/${this.id}`;
  }
}

export const GameContext = createContext<Game>({} as Game);
