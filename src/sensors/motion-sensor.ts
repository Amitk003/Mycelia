export interface MotionReading {
  tiltX: number;
  tiltY: number;
}

export class MotionSensor {
  private tiltX = 0;
  private tiltY = 0;
  active = false;

  start(): void {
    if ("DeviceOrientationEvent" in window) {
      window.addEventListener("deviceorientation", this.onOrientation);
      this.active = true;
    }
  }

  stop(): void {
    this.active = false;
    window.removeEventListener("deviceorientation", this.onOrientation);
  }

  private onOrientation = (e: DeviceOrientationEvent): void => {
    this.tiltX = ((e.gamma ?? 0) + 90) / 180;
    this.tiltY = ((e.beta ?? 0) + 180) / 360;
  };

  read(): MotionReading {
    return { tiltX: this.tiltX, tiltY: this.tiltY };
  }
}
