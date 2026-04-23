import { Petal, type Entity } from "./entities/Petal";
import { Snack } from "./entities/Snack";
import { Spawner } from "./systems/Spawner";
import { InputSystem } from "./systems/Input";

export type GameEventType = "petal_catch" | "snack_catch" | "miss";

export interface GameEvent {
  type: GameEventType;
  timestamp: number;
}

export interface GameCallbacks {
  onScore: (points: number, type: "petal" | "snack") => void;
  onEvent: (event: GameEvent) => void;
  onEnd: () => void;
}

const LOGICAL_WIDTH = 400;
const LOGICAL_HEIGHT = 700;
const GAME_DURATION_MS = 60_000;

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private spawner: Spawner;
  private input: InputSystem;
  private petals: Petal[] = [];
  private snacks: Snack[] = [];
  private rafId: number | null = null;
  private lastTime: number | null = null;
  private startTime: number | null = null;
  private callbacks: GameCallbacks;
  private scale: number = 1;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D not supported");
    this.ctx = ctx;
    this.spawner = new Spawner();
    this.input = new InputSystem(canvas, this.handleCatch.bind(this), this.scale);
    this.setupCanvas();
  }

  private setupCanvas() {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    this.canvas.width = LOGICAL_WIDTH * dpr;
    this.canvas.height = LOGICAL_HEIGHT * dpr;
    this.canvas.style.width = `${LOGICAL_WIDTH}px`;
    this.canvas.style.height = `${LOGICAL_HEIGHT}px`;
    this.ctx.scale(dpr, dpr);
  }

  private handleCatch(entity: Entity) {
    entity.caught = true;
    const isPetal = entity instanceof Petal;
    const points = (entity as Petal | Snack).points;
    this.callbacks.onScore(points, isPetal ? "petal" : "snack");
    this.callbacks.onEvent({
      type: isPetal ? "petal_catch" : "snack_catch",
      timestamp: Date.now(),
    });
  }

  private update(dt: number) {
    const { petals: newPetals, snacks: newSnacks } = this.spawner.update(dt, LOGICAL_WIDTH);
    this.petals.push(...newPetals);
    this.snacks.push(...newSnacks);

    for (const p of this.petals) p.update(dt, LOGICAL_HEIGHT);
    for (const s of this.snacks) s.update(dt, LOGICAL_HEIGHT);

    this.petals = this.petals.filter((p) => !p.caught && !p.offScreen);
    this.snacks = this.snacks.filter((s) => !s.caught && !s.offScreen);

    const allEntities: Entity[] = [...this.petals, ...this.snacks];
    (this.canvas as unknown as { _entities?: Entity[] })._entities = allEntities;
  }

  private render(elapsed: number) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    const gradient = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    gradient.addColorStop(0, "#fff0f5");
    gradient.addColorStop(1, "#ffd6e7");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    for (const p of this.petals) p.render(ctx);
    for (const s of this.snacks) s.render(ctx);

    const remaining = Math.max(0, GAME_DURATION_MS - elapsed);
    const seconds = Math.ceil(remaining / 1000);
    ctx.fillStyle = remaining < 10_000 ? "#e8004d" : "#87002e";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(`${seconds}s`, LOGICAL_WIDTH - 16, 16);
  }

  private loop(timestamp: number) {
    if (!this.startTime) this.startTime = timestamp;
    const elapsed = timestamp - this.startTime;

    if (elapsed >= GAME_DURATION_MS) {
      this.render(elapsed);
      this.stop();
      this.callbacks.onEnd();
      return;
    }

    const dt = this.lastTime !== null ? (timestamp - this.lastTime) / 1000 : 0;
    this.lastTime = timestamp;

    this.update(dt);
    this.render(elapsed);

    this.rafId = requestAnimationFrame((ts) => this.loop(ts));
  }

  start() {
    this.petals = [];
    this.snacks = [];
    this.spawner.reset();
    this.lastTime = null;
    this.startTime = null;
    this.rafId = requestAnimationFrame((ts) => this.loop(ts));
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.stop();
    this.input.destroy();
  }

  static get LOGICAL_WIDTH() { return LOGICAL_WIDTH; }
  static get LOGICAL_HEIGHT() { return LOGICAL_HEIGHT; }
}
