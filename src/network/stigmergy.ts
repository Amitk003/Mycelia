import type { PeerManager } from "./peer-manager";
import type { NetworkPacket } from "./mesh-types";

export type Chemical = "food" | "danger" | "stress" | "success" | "explore";

export interface PheromoneDeposit {
  chemical: Chemical;
  concentration: number;
  x: number;
  y: number;
  sourcePeerId: string;
  message: string;
  timestamp: number;
}

export interface StigmergyConfig {
  gridWidth: number;
  gridHeight: number;
  decayRate: number;
  diffusionRate: number;
  gossipInterval: number;
}

const DEFAULT_CONFIG: StigmergyConfig = {
  gridWidth: 10,
  gridHeight: 10,
  decayRate: 0.95,
  diffusionRate: 0.1,
  gossipInterval: 3,
};

const CHEMICALS: Chemical[] = ["food", "danger", "stress", "success", "explore"];

export class StigmergyField {
  private grid: Float32Array;
  private config: StigmergyConfig;
  private peerManager: PeerManager;
  private tickCounter = 0;
  private deposits: PheromoneDeposit[] = [];

  constructor(peerManager: PeerManager, config?: Partial<StigmergyConfig>) {
    this.peerManager = peerManager;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.grid = new Float32Array(this.config.gridWidth * this.config.gridHeight * CHEMICALS.length);
  }

  getGridWidth(): number {
    return this.config.gridWidth;
  }

  getGridHeight(): number {
    return this.config.gridHeight;
  }

  getChemicalCount(): number {
    return CHEMICALS.length;
  }

  getGrid(): Float32Array {
    return this.grid;
  }

  getChemicalName(index: number): string {
    return CHEMICALS[index] || "unknown";
  }

  deposit(chemical: Chemical, concentration: number, message: string): void {
    const x = Math.floor(Math.random() * this.config.gridWidth);
    const y = Math.floor(Math.random() * this.config.gridHeight);
    const chemIndex = CHEMICALS.indexOf(chemical);

    if (chemIndex < 0) return;

    const gridIndex = (y * this.config.gridWidth + x) * CHEMICALS.length + chemIndex;
    this.grid[gridIndex] = Math.min(1, this.grid[gridIndex] + concentration);

    this.deposits.push({
      chemical,
      concentration,
      x,
      y,
      sourcePeerId: this.peerManager.getPeerId(),
      message,
      timestamp: Date.now(),
    });
  }

  sense(chemical: Chemical): { x: number; y: number; concentration: number } | null {
    const chemIndex = CHEMICALS.indexOf(chemical);
    if (chemIndex < 0) return null;

    let bestX = 0;
    let bestY = 0;
    let bestConc = 0;

    for (let y = 0; y < this.config.gridHeight; y++) {
      for (let x = 0; x < this.config.gridWidth; x++) {
        const idx = (y * this.config.gridWidth + x) * CHEMICALS.length + chemIndex;
        if (this.grid[idx] > bestConc) {
          bestConc = this.grid[idx];
          bestX = x;
          bestY = y;
        }
      }
    }

    if (bestConc > 0) {
      return { x: bestX, y: bestY, concentration: bestConc };
    }
    return null;
  }

  tick(): void {
    this.tickCounter++;

    // decay
    const len = this.grid.length;
    for (let i = 0; i < len; i++) {
      this.grid[i] *= this.config.decayRate;
      if (this.grid[i] < 0.01) {
        this.grid[i] = 0;
      }
    }

    // diffusion
    const w = this.config.gridWidth;
    const h = this.config.gridHeight;
    const cCount = CHEMICALS.length;
    const result = new Float32Array(this.grid);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        for (let c = 0; c < cCount; c++) {
          const center = (y * w + x) * cCount + c;
          let sum = this.grid[center];
          let count = 1;

          if (x > 0) { sum += this.grid[(y * w + (x - 1)) * cCount + c]; count++; }
          if (x < w - 1) { sum += this.grid[(y * w + (x + 1)) * cCount + c]; count++; }
          if (y > 0) { sum += this.grid[((y - 1) * w + x) * cCount + c]; count++; }
          if (y < h - 1) { sum += this.grid[((y + 1) * w + x) * cCount + c]; count++; }

          const avg = sum / count;
          result[center] = this.grid[center] + (avg - this.grid[center]) * this.config.diffusionRate;
        }
      }
    }
    this.grid = result;

    // gossip
    if (this.tickCounter % this.config.gossipInterval === 0 && this.deposits.length > 0) {
      const recent = this.deposits.slice(-3);
      for (const deposit of recent) {
        const packet: NetworkPacket = {
          type: "pheromone",
          sourcePeerId: this.peerManager.getPeerId(),
          generation: 0,
          ttl: 3,
          payload: JSON.stringify(deposit),
          checksum: 0,
          timestamp: Date.now(),
        };
        this.peerManager.broadcast(packet);
      }
    }
  }

  applyRemoteDeposit(deposit: PheromoneDeposit): void {
    const chemIndex = CHEMICALS.indexOf(deposit.chemical);
    if (chemIndex < 0) return;

    const x = Math.min(deposit.x, this.config.gridWidth - 1);
    const y = Math.min(deposit.y, this.config.gridHeight - 1);
    const gridIndex = (y * this.config.gridWidth + x) * CHEMICALS.length + chemIndex;
    this.grid[gridIndex] = Math.min(1, this.grid[gridIndex] + deposit.concentration * 0.5);
  }

  getGridSnapshot(): Float32Array {
    return new Float32Array(this.grid);
  }
}
