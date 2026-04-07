export interface Card {
  answer: string;
  category: string;
  clues: string[];
}

export interface Player {
  id: number;
  name: string;
  score: number;
  cluesGuessedAt: number[];
}

export interface DisputaUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  score: number;
  stars: number;
  cooldownUntil?: number;
}

export interface Challenge {
  id?: string;
  challengerId: string;
  challengerName: string;
  challengedId: string;
  challengedName: string;
  challengerFirstClueCount: number;
  status: 'pending' | 'completed' | 'expired';
  createdAt: number;
}

export interface ActiveChallenge {
  type: 'issuing' | 'responding';
  targetId?: string;
  targetName?: string;
  challengeId?: string;
  challengerId?: string;
  challengerFirstClueCount?: number;
}

export type GameState = 'home' | 'setup' | 'playing' | 'result' | 'disputaLogin' | 'ranking';
export type Difficulty = 'easy' | 'medium' | 'hard';
