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

  constructor(id: number, canvasWidth: number) {
    this.id = id;
    this.x = Math.random() * canvasWidth;
    this.y = -20;
    this.width = 24 + Math.random() * 16;
    this.height = this.width;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = 1.5 + Math.random() * 2;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.caught = false;
    this.offScreen = false;
    this.points = 1;
  }

  update(dt: number, canvasHeight: number) {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.rotation += this.rotationSpeed * dt * 60;
    if (this.y > canvasHeight + 30) this.offScreen = true;
  }

  render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
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
