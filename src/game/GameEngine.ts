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
  onTimeLeft?: (timeLeft: number) => void;
}

const LOGICAL_WIDTH = 400;
const LOGICAL_HEIGHT = 700;
const GAME_DURATION_MS = 30_000;
const BASKET_WIDTH = 96;
const BASKET_HEIGHT = 42;
const BASKET_Y = LOGICAL_HEIGHT - 58;
const BACKGROUND_SRC = "/assets/backgrounds/gameplay.png";
const BASKET_DRAW_SIZE = 96;
const BASKET_BOTTOM_OFFSET = 6;
const BASKET_MOVING_FRAME_HOLD = 0.16;
const BASKET_MOVEMENT_EPSILON = 0.5;
const BASKET_IMAGE_SOURCES = {
  left: "/assets/game/basket/basket-left.png",
  idle: "/assets/game/basket/basket-idle.png",
  right: "/assets/game/basket/basket-right.png",
} as const;
const SCORE_POPUP_DURATION = 0.7;
const SCORE_POPUP_SIZE: Record<number, { src: string; width: number; height: number }> = {
  1: { src: "/assets/game/score-popups/plus-1.png", width: 46, height: 46 },
  20: { src: "/assets/game/score-popups/plus-20.png", width: 64, height: 46 },
  50: { src: "/assets/game/score-popups/plus-50.png", width: 64, height: 46 },
};

interface ScorePopup {
  x: number;
  y: number;
  points: number;
  age: number;
}

type BasketFrame = keyof typeof BASKET_IMAGE_SOURCES;

export class GameEngine {
  private static readonly scorePopupImages = new Map<number, HTMLImageElement>();
  private static readonly basketImages = new Map<BasketFrame, HTMLImageElement>();

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private spawner: Spawner;
  private input: InputSystem;
  private petals: Petal[] = [];
  private snacks: Snack[] = [];
  private scorePopups: ScorePopup[] = [];
  private rafId: number | null = null;
  private lastTime: number | null = null;
  private startTime: number | null = null;
  private pauseStartedAt: number | null = null;
  private pausedDuration = 0;
  private lastTimeLeft = GAME_DURATION_MS / 1000;
  private callbacks: GameCallbacks;
  private scale: number = 1;
  private basketX = (LOGICAL_WIDTH - BASKET_WIDTH) / 2;
  private basketFrame: BasketFrame = "idle";
  private basketFrameAge = 0;
  private backgroundImage: HTMLImageElement | null = null;
  private readonly handleResize = () => this.setupCanvas();

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D not supported");
    this.ctx = ctx;
    this.spawner = new Spawner();
    this.input = new InputSystem(canvas, this.moveBasket.bind(this), this.scale);
    this.loadBackground();
    Snack.preloadImages();
    GameEngine.loadBasketImages();
    GameEngine.loadScorePopupImages();
    this.setupCanvas();

    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.handleResize);
      window.addEventListener("orientationchange", this.handleResize);
    }
  }

  private loadBackground() {
    if (typeof window === "undefined") return;

    const image = new window.Image();
    image.src = BACKGROUND_SRC;
    this.backgroundImage = image;
  }

  private setupCanvas() {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    this.canvas.width = LOGICAL_WIDTH * dpr;
    this.canvas.height = LOGICAL_HEIGHT * dpr;
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const rect = this.canvas.getBoundingClientRect();
    this.scale = rect.width > 0 ? rect.width / LOGICAL_WIDTH : 1;
    this.input.updateScale(this.scale);
  }

  private moveBasket(centerX: number) {
    const nextX = Math.max(0, Math.min(LOGICAL_WIDTH - BASKET_WIDTH, centerX - BASKET_WIDTH / 2));
    const delta = nextX - this.basketX;

    if (Math.abs(delta) > BASKET_MOVEMENT_EPSILON) {
      this.basketFrame = delta < 0 ? "left" : "right";
      this.basketFrameAge = 0;
    }

    this.basketX = nextX;
  }

  private handleCatch(entity: Entity) {
    entity.caught = true;
    const isPetal = entity instanceof Petal;
    const points = (entity as Petal | Snack).points;
    this.addScorePopup(entity, points);
    this.callbacks.onScore(points, isPetal ? "petal" : "snack");
    this.callbacks.onEvent({
      type: isPetal ? "petal_catch" : "snack_catch",
      timestamp: Date.now(),
    });
  }

  private static loadScorePopupImages() {
    if (typeof window === "undefined") return;

    for (const [points, config] of Object.entries(SCORE_POPUP_SIZE)) {
      const key = Number(points);
      if (GameEngine.scorePopupImages.has(key)) continue;

      const image = new window.Image();
      image.src = config.src;
      GameEngine.scorePopupImages.set(key, image);
    }
  }

  private static loadBasketImages() {
    if (typeof window === "undefined") return;

    for (const [frame, src] of Object.entries(BASKET_IMAGE_SOURCES)) {
      const key = frame as BasketFrame;
      if (GameEngine.basketImages.has(key)) continue;

      const image = new window.Image();
      image.src = src;
      GameEngine.basketImages.set(key, image);
    }
  }

  private addScorePopup(entity: Entity, points: number) {
    const config = SCORE_POPUP_SIZE[points] ?? SCORE_POPUP_SIZE[20];
    this.scorePopups.push({
      x: entity.x + entity.width / 2 - config.width / 2,
      y: entity.y - config.height * 0.35,
      points,
      age: 0,
    });
  }

  private isInBasket(entity: Entity) {
    const entityBottom = entity.y + entity.height;
    const entityCenterX = entity.x + entity.width / 2;

    return (
      entityBottom >= BASKET_Y + 6 &&
      entity.y <= BASKET_Y + BASKET_HEIGHT &&
      entityCenterX >= this.basketX &&
      entityCenterX <= this.basketX + BASKET_WIDTH
    );
  }

  private update(dt: number) {
    const { petals: newPetals, snacks: newSnacks } = this.spawner.update(dt, LOGICAL_WIDTH);
    this.petals.push(...newPetals);
    this.snacks.push(...newSnacks);

    for (const p of this.petals) p.update(dt, LOGICAL_HEIGHT);
    for (const s of this.snacks) s.update(dt, LOGICAL_HEIGHT);
    for (const popup of this.scorePopups) popup.age += dt;
    this.basketFrameAge += dt;

    if (this.basketFrameAge > BASKET_MOVING_FRAME_HOLD) {
      this.basketFrame = "idle";
    }

    for (const entity of [...this.petals, ...this.snacks]) {
      if (!entity.caught && !entity.offScreen && this.isInBasket(entity)) {
        this.handleCatch(entity);
      }
    }

    this.petals = this.petals.filter((p) => !p.caught && !p.offScreen);
    this.snacks = this.snacks.filter((s) => !s.caught && !s.offScreen);
    this.scorePopups = this.scorePopups.filter((popup) => popup.age < SCORE_POPUP_DURATION);

    const allEntities: Entity[] = [...this.petals, ...this.snacks];
    (this.canvas as unknown as { _entities?: Entity[] })._entities = allEntities;
  }

  private render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    this.renderBackground(ctx);

    this.renderBasket(ctx);
    for (const p of this.petals) p.render(ctx);
    for (const s of this.snacks) s.render(ctx);
    this.renderScorePopups(ctx);
  }

  private renderScorePopups(ctx: CanvasRenderingContext2D) {
    for (const popup of this.scorePopups) {
      const config = SCORE_POPUP_SIZE[popup.points] ?? SCORE_POPUP_SIZE[20];
      const image = GameEngine.scorePopupImages.get(popup.points);
      const progress = Math.min(1, popup.age / SCORE_POPUP_DURATION);
      const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
      const alpha = progress < 0.72 ? 1 : Math.max(0, (1 - progress) / 0.28);
      const width = config.width * scale;
      const height = config.height * scale;
      const x = popup.x + (config.width - width) / 2;
      const y = popup.y - progress * 30 + (config.height - height) / 2;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.imageSmoothingEnabled = false;

      if (image?.complete && image.naturalWidth > 0) {
        ctx.drawImage(image, x, y, width, height);
      } else {
        ctx.fillStyle = popup.points === 1 ? "#ff85a1" : "#ffffff";
        ctx.strokeStyle = "#ec4899";
        ctx.lineWidth = 3;
        ctx.font = "24px 'Press Start 2P', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeText(`+${popup.points}`, x + width / 2, y + height / 2);
        ctx.fillText(`+${popup.points}`, x + width / 2, y + height / 2);
      }

      ctx.restore();
    }
  }

  private renderBackground(ctx: CanvasRenderingContext2D) {
    const background = this.backgroundImage;

    if (background?.complete && background.naturalWidth > 0) {
      const scale = Math.max(
        LOGICAL_WIDTH / background.naturalWidth,
        LOGICAL_HEIGHT / background.naturalHeight,
      );
      const width = background.naturalWidth * scale;
      const height = background.naturalHeight * scale;
      const x = (LOGICAL_WIDTH - width) / 2;
      const y = (LOGICAL_HEIGHT - height) / 2;
      ctx.drawImage(background, x, y, width, height);
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    gradient.addColorStop(0, "#fff0f5");
    gradient.addColorStop(1, "#ffd6e7");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  }

  private renderBasket(ctx: CanvasRenderingContext2D) {
    const x = this.basketX;
    const y = BASKET_Y;
    const basket =
      GameEngine.basketImages.get(this.basketFrame) ?? GameEngine.basketImages.get("idle");

    if (basket?.complete && basket.naturalWidth > 0) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        basket,
        x + (BASKET_WIDTH - BASKET_DRAW_SIZE) / 2,
        y + BASKET_HEIGHT - BASKET_DRAW_SIZE + BASKET_BOTTOM_OFFSET,
        BASKET_DRAW_SIZE,
        BASKET_DRAW_SIZE,
      );
      ctx.restore();
      return;
    }
  }

  private emitTimeLeft(elapsed: number) {
    const timeLeft = Math.max(0, Math.ceil((GAME_DURATION_MS - elapsed) / 1000));

    if (timeLeft !== this.lastTimeLeft) {
      this.lastTimeLeft = timeLeft;
      this.callbacks.onTimeLeft?.(timeLeft);
    }
  }

  private loop(timestamp: number) {
    if (!this.startTime) this.startTime = timestamp;
    const elapsed = timestamp - this.startTime - this.pausedDuration;
    this.emitTimeLeft(elapsed);

    if (elapsed >= GAME_DURATION_MS) {
      this.emitTimeLeft(GAME_DURATION_MS);
      this.render();
      this.stop();
      this.callbacks.onEnd();
      return;
    }

    const dt = this.lastTime !== null ? (timestamp - this.lastTime) / 1000 : 0;
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    this.rafId = requestAnimationFrame((ts) => this.loop(ts));
  }

  start() {
    this.petals = [];
    this.snacks = [];
    this.scorePopups = [];
    this.spawner.reset();
    this.basketX = (LOGICAL_WIDTH - BASKET_WIDTH) / 2;
    this.basketFrame = "idle";
    this.basketFrameAge = 0;
    this.lastTime = null;
    this.startTime = null;
    this.pauseStartedAt = null;
    this.pausedDuration = 0;
    this.lastTimeLeft = GAME_DURATION_MS / 1000;
    this.callbacks.onTimeLeft?.(this.lastTimeLeft);
    this.rafId = requestAnimationFrame((ts) => this.loop(ts));
  }

  pause() {
    if (this.pauseStartedAt !== null) return;

    this.pauseStartedAt = performance.now();
    this.stop();
  }

  resume() {
    if (this.pauseStartedAt === null) return;

    this.pausedDuration += performance.now() - this.pauseStartedAt;
    this.pauseStartedAt = null;
    this.lastTime = null;
    this.rafId = requestAnimationFrame((ts) => this.loop(ts));
  }

  isPaused() {
    return this.pauseStartedAt !== null;
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

    if (typeof window !== "undefined") {
      window.removeEventListener("resize", this.handleResize);
      window.removeEventListener("orientationchange", this.handleResize);
    }
  }

  static get LOGICAL_WIDTH() { return LOGICAL_WIDTH; }
  static get LOGICAL_HEIGHT() { return LOGICAL_HEIGHT; }
}
