export class Input {
  readonly keys = new Set<string>();
  mouseX = 0;
  mouseY = 0;
  dx = 0;
  dy = 0;
  lmb = false;
  rmb = false;
  wheel = 0;
  locked = false;
  private canvas: HTMLCanvasElement;
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    window.addEventListener("keydown", (e) => {
      this.keys.add(e.code);
      if (["Space", "KeyF", "KeyE", "KeyQ"].includes(e.code)) e.preventDefault();
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) this.lmb = true;
      if (e.button === 2) this.rmb = true;
      if (document.pointerLockElement !== canvas) canvas.requestPointerLock();
    });
    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.lmb = false;
      if (e.button === 2) this.rmb = false;
    });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement === canvas) {
        this.dx += e.movementX;
        this.dy += e.movementY;
      }
    });
    canvas.addEventListener("wheel", (e) => { this.wheel += Math.sign(e.deltaY); }, { passive: true });
    document.addEventListener("pointerlockchange", () => {
      this.locked = document.pointerLockElement === canvas;
    });
  }
  consumeLook(): { x: number; y: number } {
    const out = { x: this.dx, y: this.dy };
    this.dx = 0; this.dy = 0; return out;
  }
  consumeWheel(): number { const w = this.wheel; this.wheel = 0; return w; }
  axis(): { x: number; z: number } {
    let x = 0, z = 0;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) x -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) x += 1;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) z -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) z += 1;
    const len = Math.hypot(x, z);
    if (len > 1) { x /= len; z /= len; }
    return { x, z };
  }
  pressed(code: string): boolean { return this.keys.has(code); }
}
