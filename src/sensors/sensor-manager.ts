import type { SensorField } from "../../pkg/mycelia-core/mycelia_core.js";
import { CameraSensor } from "./camera-sensor";
import { AudioSensor } from "./audio-sensor";
import { MotionSensor } from "./motion-sensor";

export interface SensorManagerStatus {
  camera: boolean;
  audio: boolean;
  motion: boolean;
}

export class SensorManager {
  private camera: CameraSensor;
  private audio: AudioSensor;
  private motion: MotionSensor;
  private sensorField: SensorField | null = null;
  private status: SensorManagerStatus = { camera: false, audio: false, motion: false };

  constructor() {
    this.camera = new CameraSensor();
    this.audio = new AudioSensor();
    this.motion = new MotionSensor();
  }

  async init(): Promise<void> {
    await this.camera.start();
    if (this.camera.active) this.status.camera = true;

    await this.audio.start();
    if (this.audio.active) this.status.audio = true;

    this.motion.start();
    if (this.motion.active) this.status.motion = true;
  }

  setSensorField(field: SensorField): void {
    this.sensorField = field;
  }

  tick(): void {
    if (!this.sensorField) return;

    const cam = this.camera.read();
    this.sensorField.update_brightness(cam.brightness);
    this.sensorField.color_temperature = cam.colorTemperature;
    this.sensorField.motion_delta = cam.motionDelta;

    const aud = this.audio.read();
    this.sensorField.ambient_volume = aud.ambientVolume;
    this.sensorField.low_freq_rumbling = aud.lowFreqRumble;

    const mot = this.motion.read();
    this.sensorField.update_device_tilt(mot.tiltX, mot.tiltY);

    this.sensorField.tab_visible = !document.hidden;
  }

  getStatus(): SensorManagerStatus {
    return { ...this.status };
  }
}
