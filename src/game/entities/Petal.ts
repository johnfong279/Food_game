export interface Entity {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  caught: boolean;
  offScreen: boolean;
}

export class Petal implements Entity {
  private static readonly SPRITE_SRC = "/assets/game/petals/sheet-transparent.png";
  private static readonly SPRITE_FRAME_SIZE = 32;
  private static readonly SPRITE_FRAME_COUNT = 4;
  private static spriteImage: HTMLImageElement | null = null;
  private static spriteLoaded = false;

  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  caught: boolean;
  offScreen: boolean;
  points: number;
  private animationTime: number;
  private frameOffset: number;

  constructor(id: number, canvasWidth: number) {
    Petal.loadSprite();
    this.id = id;
    this.x = Math.random() * canvasWidth;
    this.y = -20;
    this.width = 28 + Math.random() * 14;
    this.height = this.width;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = 1.5 + Math.random() * 2;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.caught = false;
    this.offScreen = false;
    this.points = 1;
    this.animationTime = 0;
    this.frameOffset = Math.floor(Math.random() * Petal.SPRITE_FRAME_COUNT);
  }

  update(dt: number, canvasHeight: number, speedMultiplier = 1) {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60 * speedMultiplier;
    this.rotation += this.rotationSpeed * dt * 60 * speedMultiplier;
    this.animationTime += dt;
    if (this.y > canvasHeight + 30) this.offScreen = true;
  }

  render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    if (Petal.spriteLoaded && Petal.spriteImage) {
      this.renderSprite(ctx, Petal.spriteImage);
      return;
    }

    this.renderFallback(ctx);
  }

  private static loadSprite() {
    if (Petal.spriteImage || typeof Image === "undefined") return;

    const image = new Image();
    image.onload = () => {
      Petal.spriteLoaded = true;
    };
    image.src = Petal.SPRITE_SRC;
    Petal.spriteImage = image;
  }

  private renderSprite(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    image: HTMLImageElement,
  ) {
    const frame = (Math.floor(this.animationTime / 0.16) + this.frameOffset) % Petal.SPRITE_FRAME_COUNT;
    const sx = frame * Petal.SPRITE_FRAME_SIZE;
    const smoothing = ctx.imageSmoothingEnabled;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      image,
      sx,
      0,
      Petal.SPRITE_FRAME_SIZE,
      Petal.SPRITE_FRAME_SIZE,
      this.x,
      this.y,
      this.width,
      this.height,
    );
    ctx.imageSmoothingEnabled = smoothing;
    ctx.restore();
  }

  private renderFallback(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);
    ctx.fillStyle = "#ffb7c5";
    ctx.beginPath();
    const r = this.width / 2;
    ctx.ellipse(-r * 0.3, -r * 0.5, r * 0.5, r * 0.8, Math.PI / 6, 0, Math.PI * 2);
    ctx.ellipse(r * 0.3, -r * 0.5, r * 0.5, r * 0.8, -Math.PI / 6, 0, Math.PI * 2);
    ctx.ellipse(r * 0.6, 0, r * 0.5, r * 0.8, Math.PI / 3, 0, Math.PI * 2);
    ctx.ellipse(-r * 0.6, 0, r * 0.5, r * 0.8, -Math.PI / 3, 0, Math.PI * 2);
    ctx.ellipse(0, r * 0.4, r * 0.5, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
