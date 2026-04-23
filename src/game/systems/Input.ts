import type { Entity } from "../entities/Petal";

type HitCallback = (entity: Entity) => void;

function hitTest(x: number, y: number, entity: Entity): boolean {
  return (
    x >= entity.x &&
    x <= entity.x + entity.width &&
    y >= entity.y &&
    y <= entity.y + entity.height
  );
}

export class InputSystem {
  private canvas: HTMLCanvasElement;
  private onCatch: HitCallback;
  private scale: number;

  constructor(canvas: HTMLCanvasElement, onCatch: HitCallback, scale: number = 1) {
    this.canvas = canvas;
    this.onCatch = onCatch;
    this.scale = scale;
    this.handleTouch = this.handleTouch.bind(this);
    this.handleClick = this.handleClick.bind(this);
    canvas.addEventListener("touchstart", this.handleTouch, { passive: false });
    canvas.addEventListener("click", this.handleClick);
  }

  updateScale(scale: number) {
    this.scale = scale;
  }

  private getCanvasPos(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / this.scale,
      y: (clientY - rect.top) / this.scale,
    };
  }

  private handleTouch(e: TouchEvent) {
    e.preventDefault();
    const entities = (this.canvas as unknown as { _entities?: Entity[] })._entities ?? [];
    for (let t = 0; t < e.changedTouches.length; t++) {
      const touch = e.changedTouches[t];
      const { x, y } = this.getCanvasPos(touch.clientX, touch.clientY);
      for (const entity of entities) {
        if (!entity.caught && !entity.offScreen && hitTest(x, y, entity)) {
          this.onCatch(entity);
          break;
        }
      }
    }
  }

  private handleClick(e: MouseEvent) {
    const { x, y } = this.getCanvasPos(e.clientX, e.clientY);
    const entities = (this.canvas as unknown as { _entities?: Entity[] })._entities ?? [];
    for (const entity of entities) {
      if (!entity.caught && !entity.offScreen && hitTest(x, y, entity)) {
        this.onCatch(entity);
        break;
      }
    }
  }

  destroy() {
    this.canvas.removeEventListener("touchstart", this.handleTouch);
    this.canvas.removeEventListener("click", this.handleClick);
  }
}
