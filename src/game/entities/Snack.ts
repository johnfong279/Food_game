import type { Entity } from "./Petal";

export type SnackVariant =
  | "okraCrisp"
  | "potatoStick"
  | "purpleOnionCrisp"
  | "shiitakeMushroom"
  | "okraPack"
  | "potatoPack"
  | "purpleOnionPack"
  | "shiitakeMushroomPack";

interface SnackConfig {
  src: string;
  points: number;
  speed: number;
  width: number;
  height: number;
}

const SNACK_CONFIGS: Record<SnackVariant, SnackConfig> = {
  okraCrisp: {
    src: "/assets/game/items/okra-crisps-20.png",
    points: 20,
    speed: 2.2,
    width: 92,
    height: 92,
  },
  potatoStick: {
    src: "/assets/game/items/potato-sticks-20.png",
    points: 20,
    speed: 2.5,
    width: 92,
    height: 92,
  },
  purpleOnionCrisp: {
    src: "/assets/game/items/sweet-purple-onion-crisps-20.png",
    points: 20,
    speed: 2.3,
    width: 92,
    height: 92,
  },
  shiitakeMushroom: {
    src: "/assets/game/items/shiitake-mushroom-crisps-20.png",
    points: 20,
    speed: 2.1,
    width: 92,
    height: 92,
  },
  okraPack: {
    src: "/assets/game/items/okra-crisps-pack-50.png",
    points: 50,
    speed: 1.8,
    width: 104,
    height: 104,
  },
  potatoPack: {
    src: "/assets/game/items/potato-sticks-pack-50.png",
    points: 50,
    speed: 1.9,
    width: 104,
    height: 104,
  },
  purpleOnionPack: {
    src: "/assets/game/items/sweet-purple-onion-crisps-pack-50.png",
    points: 50,
    speed: 1.8,
    width: 104,
    height: 104,
  },
  shiitakeMushroomPack: {
    src: "/assets/game/items/shiitake-mushroom-crisps-pack-50.png",
    points: 50,
    speed: 1.8,
    width: 104,
    height: 104,
  },
};

const VARIANTS = Object.keys(SNACK_CONFIGS) as SnackVariant[];

export class Snack implements Entity {
  private static readonly imageCache = new Map<string, HTMLImageElement>();

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
    Snack.loadImage(this.config.src);
    this.width = this.config.width;
    this.height = this.config.height;
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
    const image = Snack.imageCache.get(this.config.src);

    if (image?.complete && image.naturalWidth > 0) {
      const smoothing = ctx.imageSmoothingEnabled;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, this.x, this.y, this.width, this.height);
      ctx.imageSmoothingEnabled = smoothing;
      ctx.restore();
      return;
    }

    this.renderFallback(ctx);
  }

  private static loadImage(src: string) {
    if (Snack.imageCache.has(src) || typeof Image === "undefined") return;

    const image = new Image();
    image.src = src;
    Snack.imageCache.set(src, image);
  }

  private renderFallback(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = this.points === 50 ? "#f7c948" : "#66a80f";
    ctx.strokeStyle = "#2b5d12";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px 'Press Start 2P', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`+${this.points}`, this.x + this.width / 2, this.y + this.height / 2);
    ctx.restore();
  }
}
