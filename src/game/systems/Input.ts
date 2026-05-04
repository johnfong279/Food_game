type MoveCallback = (x: number) => void;

export class InputSystem {
  private canvas: HTMLCanvasElement;
  private onMove: MoveCallback;
  private scale: number;

  constructor(canvas: HTMLCanvasElement, onMove: MoveCallback, scale: number = 1) {
    this.canvas = canvas;
    this.onMove = onMove;
    this.scale = scale;
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handleTouch = this.handleTouch.bind(this);
    canvas.addEventListener("pointermove", this.handlePointerMove);
    canvas.addEventListener("touchstart", this.handleTouch, { passive: false });
    canvas.addEventListener("touchmove", this.handleTouch, { passive: false });
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
    const touch = e.changedTouches[0];
    if (touch) {
      this.onMove(this.getCanvasPos(touch.clientX, touch.clientY).x);
    }
  }

  private handlePointerMove(e: PointerEvent) {
    this.onMove(this.getCanvasPos(e.clientX, e.clientY).x);
  }

  destroy() {
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("touchstart", this.handleTouch);
    this.canvas.removeEventListener("touchmove", this.handleTouch);
  }
}
