export interface AudioReading {
  ambientVolume: number;
  lowFreqRumble: number;
}

export class AudioSensor {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  active = false;

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.context = new AudioContext();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 256;
      this.source = this.context.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount as number);
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
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    this.analyser = null;
    this.source = null;
    this.dataArray = null;
  }

  read(): AudioReading {
    if (!this.active || !this.analyser || !this.dataArray) {
      return { ambientVolume: 0, lowFreqRumble: 0 };
    }

    this.analyser.getByteFrequencyData(this.dataArray);
    const bins = this.dataArray;
    const totalBins = bins.length;

    let sumAll = 0;
    let sumLow = 0;
    const lowEnd = Math.floor(totalBins * 0.15);

    for (let i = 0; i < totalBins; i++) {
      sumAll += bins[i];
      if (i < lowEnd) sumLow += bins[i];
    }

    const ambientVolume = sumAll / (totalBins * 255);
    const lowFreqRumble = sumLow / (lowEnd * 255);

    return {
      ambientVolume: Math.round(ambientVolume * 100) / 100,
      lowFreqRumble: Math.round(lowFreqRumble * 100) / 100,
    };
  }
}
