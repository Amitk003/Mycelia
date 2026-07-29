export class ForestControls {
  private leafPause: HTMLElement;
  private rainSlider: HTMLInputElement;
  private rainSpeed: HTMLElement;
  private paused = false;
  private speed = 1;
  private pauseCallback: ((p: boolean) => void) | null = null;
  private speedCallback: ((s: number) => void) | null = null;

  constructor(leafPause: HTMLElement, rainSlider: HTMLInputElement, rainSpeed: HTMLElement) {
    this.leafPause = leafPause;
    this.rainSlider = rainSlider;
    this.rainSpeed = rainSpeed;
    this.setup();
  }

  private setup(): void {
    this.leafPause.addEventListener("click", () => {
      this.paused = !this.paused;
      this.leafPause.classList.toggle("paused", this.paused);
      this.pauseCallback?.(this.paused);
    });

    this.rainSlider.addEventListener("input", () => {
      this.speed = Number(this.rainSlider.value);
      this.rainSpeed.textContent = `${this.speed}x`;
      this.speedCallback?.(this.speed);
    });
  }

  onPause(cb: (p: boolean) => void): void { this.pauseCallback = cb; }
  onSpeed(cb: (s: number) => void): void { this.speedCallback = cb; }
  getSpeed(): number { return this.speed; }
  isPaused(): boolean { return this.paused; }
}
