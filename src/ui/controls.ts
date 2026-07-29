export class ForestControls {
  private leafPause: HTMLElement;
  private stepBtn: HTMLElement;
  private speedSlider: HTMLInputElement;
  private speedLabel: HTMLElement;
  private paused = false;
  private speed = 1;
  private pauseCallback: ((p: boolean) => void) | null = null;
  private speedCallback: ((s: number) => void) | null = null;
  private stepCallback: (() => void) | null = null;

  constructor(leafPause: HTMLElement, stepBtn: HTMLElement, speedSlider: HTMLInputElement, speedLabel: HTMLElement) {
    this.leafPause = leafPause;
    this.stepBtn = stepBtn;
    this.speedSlider = speedSlider;
    this.speedLabel = speedLabel;
    this.speed = Number(this.speedSlider.value);
    this.speedLabel.textContent = `${this.speed}x`;
    this.setup();
  }

  private setup(): void {
    this.leafPause.addEventListener("click", () => {
      this.paused = !this.paused;
      this.leafPause.classList.toggle("paused", this.paused);
      this.pauseCallback?.(this.paused);
    });

    this.stepBtn.addEventListener("click", () => {
      if (this.paused) this.stepCallback?.();
    });

    this.speedSlider.addEventListener("input", () => {
      this.speed = Number(this.speedSlider.value);
      this.speedLabel.textContent = `${this.speed}x`;
      this.speedCallback?.(this.speed);
    });
  }

  onPause(cb: (p: boolean) => void): void { this.pauseCallback = cb; }
  onSpeed(cb: (s: number) => void): void { this.speedCallback = cb; cb(this.speed); }
  onStepOnce(cb: () => void): void { this.stepCallback = cb; }
  getSpeed(): number { return this.speed; }
  isPaused(): boolean { return this.paused; }
}
