import { create } from "zustand";
import type { GameEvent } from "@/game/GameEngine";

export type Screen = "landing" | "game" | "end" | "email" | "leaderboard";

interface GameState {
  screen: Screen;
  sessionToken: string | null;
  score: number;
  petalsCaught: number;
  snacksCaught: number;
  durationMs: number;
  rank: number | null;
  totalPlayers: number | null;
  discountCode: string | null;
  events: GameEvent[];
}

interface GameActions {
  setScreen: (screen: Screen) => void;
  setSessionToken: (token: string) => void;
  addScore: (points: number, type: "petal" | "snack") => void;
  recordEvent: (event: GameEvent) => void;
  setDuration: (ms: number) => void;
  setResult: (result: { rank: number; totalPlayers: number; discountCode: string }) => void;
  reset: () => void;
}

const initialState: GameState = {
  screen: "landing",
  sessionToken: null,
  score: 0,
  petalsCaught: 0,
  snacksCaught: 0,
  durationMs: 0,
  rank: null,
  totalPlayers: null,
  discountCode: null,
  events: [],
};

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...initialState,

  setScreen: (screen) => set({ screen }),

  setSessionToken: (token) => set({ sessionToken: token }),

  addScore: (points, type) =>
    set((state) => ({
      score: state.score + points,
      petalsCaught: type === "petal" ? state.petalsCaught + 1 : state.petalsCaught,
      snacksCaught: type === "snack" ? state.snacksCaught + 1 : state.snacksCaught,
    })),

  recordEvent: (event) =>
    set((state) => ({ events: [...state.events, event] })),

  setDuration: (ms) => set({ durationMs: ms }),

  setResult: (result) =>
    set({ rank: result.rank, totalPlayers: result.totalPlayers, discountCode: result.discountCode }),

  reset: () => set({ ...initialState }),
}));
