export interface PerformanceSnapshot {
  fps: number;
  msPerTick: number;
  targetFps: number;
  cpuBudget: number;
  ticksSkipped: number;
  tabHidden: boolean;
  sensorResolution: number;
}

const MAX_SAMPLES = 30;

export class PerformanceMonitor {
  private frameTimes: number[] = [];
  private lastTick = 0;
  private ticksSkipped = 0;
  private targetFps = 0.5;
  private sensorResolution = 1;
  private tabVisible = true;

  constructor() {
    document.addEventListener("visibilitychange", () => {
      this.tabVisible = !document.hidden;
      this.adjustTarget();
    });
    this.adjustTarget();
  }

  private adjustTarget(): void {
    if (!this.tabVisible) {
      this.targetFps = 1;
      this.sensorResolution = 0.25;
    } else if (this.ticksSkipped > 5) {
      this.targetFps = 2;
      this.sensorResolution = 0.5;
    } else {
      this.targetFps = 0.5;
      this.sensorResolution = 1;
    }
  }

  getIntervalMs(): number {
    return Math.max(16, Math.round(1000 / this.targetFps));
  }

  beginTick(): void {
    const now = performance.now();
    if (this.lastTick > 0) {
      const elapsed = now - this.lastTick;
      this.frameTimes.push(elapsed);
      if (this.frameTimes.length > MAX_SAMPLES) {
        this.frameTimes.shift();
      }
      const expected = 1000 / this.targetFps;
      if (elapsed > expected * 2) {
        this.ticksSkipped++;
      } else {
        this.ticksSkipped = Math.max(0, this.ticksSkipped - 1);
      }
      this.adjustTarget();
    }
    this.lastTick = now;
  }

  snapshot(): PerformanceSnapshot {
    const times = this.frameTimes;
    const avgMs = times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : 0;
    return {
      fps: avgMs > 0 ? 1000 / avgMs : 0,
      msPerTick: Math.round(avgMs * 100) / 100,
      targetFps: this.targetFps,
      cpuBudget: Math.max(0, Math.round((1 - avgMs / this.getIntervalMs()) * 100)),
      ticksSkipped: this.ticksSkipped,
      tabHidden: !this.tabVisible,
      sensorResolution: this.sensorResolution,
    };
  }

  setTargetFps(fps: number): void {
    this.targetFps = Math.max(0.1, Math.min(60, fps));
  }

  getSensorResolution(): number {
    return this.sensorResolution;
  }
}
