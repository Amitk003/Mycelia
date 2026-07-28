export interface CameraReading {
  brightness: number;
  colorTemperature: number;
  motionDelta: number;
}

export class CameraSensor {
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private previousFrame: ImageData | null = null;
  active = false;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 64;
    this.canvas.height = 48;
    this.ctx = this.canvas.getContext("2d")!;
  }

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 128, height: 96, facingMode: "environment" },
      });
      this.video = document.createElement("video");
      this.video.srcObject = this.stream;
      this.video.width = 128;
      this.video.height = 96;
      await this.video.play();
      this.active = true;
    } catch {
      this.active = false;
    }
  }

  stop(): void {
    this.active = false;
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.video = null;
    this.previousFrame = null;
  }

  read(): CameraReading {
    if (!this.active || !this.video || this.video.readyState < 2) {
      return { brightness: 0.5, colorTemperature: 0.5, motionDelta: 0 };
    }

    this.ctx.drawImage(this.video, 0, 0, 64, 48);
    const frame = this.ctx.getImageData(0, 0, 64, 48);
    const pixels = frame.data;

    let totalR = 0, totalG = 0, totalB = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      totalR += pixels[i];
      totalG += pixels[i + 1];
      totalB += pixels[i + 2];
    }
    const n = pixels.length / 4;
    const avgR = totalR / n;
    const avgG = totalG / n;
    const avgB = totalB / n;

    const brightness = (avgR + avgG + avgB) / (3 * 255);
    const colorTemperature = avgR > avgB ? 0.3 + (avgR - avgB) / 510 : 0.3 - (avgB - avgR) / 510;

    let motionDelta = 0;
    if (this.previousFrame) {
      const prev = this.previousFrame.data;
      let diffSum = 0;
      const step = 16;
      for (let i = 0; i < pixels.length; i += step * 4) {
        diffSum += Math.abs(pixels[i] - prev[i]);
        diffSum += Math.abs(pixels[i + 1] - prev[i + 1]);
        diffSum += Math.abs(pixels[i + 2] - prev[i + 2]);
      }
      const maxDiff = (256 * 3) * (pixels.length / (step * 4));
      motionDelta = Math.min(1, diffSum / maxDiff);
    }
    this.previousFrame = frame;

    return { brightness, colorTemperature, motionDelta: Math.round(motionDelta * 100) / 100 };
  }
}
