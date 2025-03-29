export type Position =
  | "BTN"
  | "SB"
  | "BB"
  | "UTG"
  | "UTG+1"
  | "MP"
  | "MP+1"
  | "HJ"
  | "CO";

export type Card = { rank: string; suit: string };

export type Action =
  | "fold"
  | "check"
  | "call"
  | "bet"
  | "raise"
  | "all-in"
  | "?";

export interface ActionEntry {
  position: Position;
  action: Action;
  amount?: number;
  isQuestion?: boolean;
}

export interface StackEntry {
  position: Position;
  stack: number;
  isHero?: boolean;
}

export interface HandHistoryState {
  heroHand: [Card | null, Card | null];
  heroPosition: Position;
  playerCount: number;
  stacks: StackEntry[];
  potSize: number;

  preflopActions: Array<ActionEntry>;

  flopCards: [Card | null, Card | null, Card | null];
  flopActions: Array<ActionEntry>;

  turnCard: Card | null;
  turnActions: Array<ActionEntry>;

  riverCard: Card | null;
  riverActions: Array<ActionEntry>;

  usedCards: Set<string>; // カードの重複使用を防ぐために使われたカードを追跡
}

export type Street = "preflop" | "flop" | "turn" | "river";
