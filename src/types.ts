export interface Card {
  answer: string;
  category: string;
  clues: string[];
}

export interface Player {
  id: number;
  name: string;
  score: number;
}

export type GameState = 'setup' | 'playing' | 'result';
export type Difficulty = 'easy' | 'medium' | 'hard';
