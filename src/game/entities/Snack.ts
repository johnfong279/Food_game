import type { Entity } from "./Petal";

export type SnackVariant = "mochi" | "taiyaki" | "dango" | "pocky";

interface SnackConfig {
  color: string;
  accentColor: string;
  points: number;
  speed: number;
  size: number;
}

const SNACK_CONFIGS: Record<SnackVariant, SnackConfig> = {
  mochi:   { color: "#f9e4f0", accentColor: "#e891b8", points: 5, speed: 2.0, size: 36 },
  taiyaki: { color: "#e8a96a", accentColor: "#b5651d", points: 8, speed: 2.5, size: 40 },
  dango:   { color: "#c8a2c8", accentColor: "#9b59b6", points: 6, speed: 2.2, size: 34 },
  pocky:   { color: "#c0392b", accentColor: "#7b241c", points: 4, speed: 3.0, size: 32 },
};

const VARIANTS: SnackVariant[] = ["mochi", "taiyaki", "dango", "pocky"];

export class Snack implements Entity {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  variant: SnackVariant;
  points: number;
  caught: boolean;
  offScreen: boolean;
  private config: SnackConfig;

  constructor(id: number, canvasWidth: number) {
    this.id = id;
    this.variant = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
    this.config = SNACK_CONFIGS[this.variant];
    this.width = this.config.size;
    this.height = this.config.size;
    this.x = Math.random() * (canvasWidth - this.width);
    this.y = -this.height;
    this.vy = this.config.speed;
    this.points = this.config.points;
    this.caught = false;
    this.offScreen = false;
  }

  update(dt: number, canvasHeight: number) {
    this.y += this.vy * dt * 60;
    if (this.y > canvasHeight + 50) this.offScreen = true;
  }

  render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    const { color, accentColor } = this.config;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const r = this.width / 2;

    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;

    if (this.variant === "mochi" || this.variant === "dango") {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (this.variant === "taiyaki") {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(this.x, cy - 3, this.width, 6);
      ctx.strokeRect(this.x, cy - 3, this.width, 6);
    }

    ctx.fillStyle = accentColor;
    ctx.font = `${r * 0.7}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label: Record<SnackVariant, string> = { mochi: "🍡", taiyaki: "🐟", dango: "🍢", pocky: "🍫" };
    ctx.fillText(label[this.variant], cx, cy);
    ctx.restore();
  }
}
