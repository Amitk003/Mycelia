import type { NetworkPacket } from "./mesh-types";
import type { PeerManager } from "./peer-manager";

interface GeneFragment {
  index: number;
  data: number[];
  mutationRate: number;
  expressionLevel: number;
  sourceFitness: number;
  sourceGeneration: number;
}

interface HgtConfig {
  transferInterval: number;
  fitnessThreshold: number;
  crossoverRate: number;
}

const DEFAULT_CONFIG: HgtConfig = {
  transferInterval: 4,
  fitnessThreshold: 0.05,
  crossoverRate: 0.5,
};

export class GeneTransfer {
  private peerManager: PeerManager;
  private config: HgtConfig;
  private tickCounter = 0;

  constructor(peerManager: PeerManager, config?: Partial<HgtConfig>) {
    this.peerManager = peerManager;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  onPacket(
    packet: NetworkPacket,
    genome: {
      gene_count: () => number;
      get_gene_data: (i: number) => Float32Array;
      set_gene_data: (i: number, data: Float32Array) => void;
      generation: () => number;
      fitness: () => number;
      set_fitness: (f: number) => void;
    }
  ): void {
    if (packet.type !== "gene_fragment") return;

    try {
      const fragment: GeneFragment = JSON.parse(packet.payload);

      if (fragment.index >= genome.gene_count()) return;
      if (fragment.sourceFitness <= genome.fitness()) return;

      const localData = genome.get_gene_data(fragment.index);
      const merged: number[] = [];

      const minLen = Math.min(localData.length, fragment.data.length);
      for (let i = 0; i < minLen; i++) {
        if (Math.random() < this.config.crossoverRate && fragment.sourceFitness > genome.fitness() + this.config.fitnessThreshold) {
          merged.push(fragment.data[i]);
        } else {
          merged.push(localData[i]);
        }
      }

      for (let i = minLen; i < fragment.data.length; i++) {
        if (Math.random() < this.config.crossoverRate * 0.5) {
          merged.push(fragment.data[i]);
        }
      }
      for (let i = minLen; i < localData.length; i++) {
        merged.push(localData[i]);
      }

      genome.set_gene_data(fragment.index, new Float32Array(merged));

      const fitnessBoost = (fragment.sourceFitness - genome.fitness()) * 0.1;
      genome.set_fitness(genome.fitness() + fitnessBoost);
    } catch {
      // ignore malformed packets
    }
  }

  tick(
    genome: {
      gene_count: () => number;
      get_gene_data: (i: number) => Float32Array;
      generation: () => number;
      fitness: () => number;
    }
  ): void {
    this.tickCounter++;
    if (this.tickCounter % this.config.transferInterval !== 0) return;
    if (this.peerManager.getPeers().size === 0) return;

    const geneIndex = Math.floor(Math.random() * genome.gene_count());
    const geneData = genome.get_gene_data(geneIndex);

    const fragment: GeneFragment = {
      index: geneIndex,
      data: Array.from(geneData),
      mutationRate: 0.05,
      expressionLevel: 0.8,
      sourceFitness: genome.fitness(),
      sourceGeneration: genome.generation(),
    };

    const packet: NetworkPacket = {
      type: "gene_fragment",
      sourcePeerId: this.peerManager.getPeerId(),
      generation: genome.generation(),
      ttl: 3,
      payload: JSON.stringify(fragment),
      checksum: 0,
      timestamp: Date.now(),
    };

    this.peerManager.broadcast(packet);
  }
}
