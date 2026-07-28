import type { PeerManager } from "../network/peer-manager";
import type { NetworkPacket } from "../network/mesh-types";

export interface FeedbackEntry {
  id: string;
  proposalId: string;
  action: "accepted" | "rejected";
  category: string;
  previousFitness: number;
  newFitness: number;
  timestamp: number;
  generation: number;
}

export interface SelectivePressure {
  category: string;
  direction: number;
  strength: number;
  source: "local" | "remote";
  timestamp: number;
}

export class FeedbackTracker {
  private history: FeedbackEntry[] = [];
  private pressures: Map<string, SelectivePressure> = new Map();
  private peerManager: PeerManager;
  private maxHistory = 50;

  constructor(peerManager: PeerManager) {
    this.peerManager = peerManager;
  }

  recordFeedback(
    proposalId: string,
    category: string,
    action: "accepted" | "rejected",
    currentFitness: number
  ): FeedbackEntry {
    const fitnessDelta = action === "accepted" ? 0.05 : -0.03;
    const newFitness = Math.max(0, Math.min(1, currentFitness + fitnessDelta));

    const entry: FeedbackEntry = {
      id: `fb_${this.history.length + 1}`,
      proposalId,
      category,
      action,
      previousFitness: currentFitness,
      newFitness,
      timestamp: Date.now(),
      generation: this.history.length + 1,
    };

    this.history.unshift(entry);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    const direction = action === "accepted" ? 1 : -1;
    this.pressures.set(category, {
      category,
      direction,
      strength: Math.abs(fitnessDelta),
      source: "local",
      timestamp: Date.now(),
    });

    // broadcast feedback to peers
    const packet: NetworkPacket = {
      type: "fitness_broadcast",
      sourcePeerId: this.peerManager.getPeerId(),
      generation: entry.generation,
      ttl: 3,
      payload: JSON.stringify({
        feedbackType: "selective_pressure",
        category,
        direction,
        strength: Math.abs(fitnessDelta),
      }),
      checksum: 0,
      timestamp: Date.now(),
    };
    this.peerManager.broadcast(packet);

    return entry;
  }

  applyRemotePressure(payload: string): void {
    try {
      const data = JSON.parse(payload);
      if (data.feedbackType === "selective_pressure") {
        this.pressures.set(data.category, {
          category: data.category,
          direction: data.direction,
          strength: data.strength,
          source: "remote",
          timestamp: Date.now(),
        });
      }
    } catch {
      // ignore malformed payloads
    }
  }

  getActivePressures(): SelectivePressure[] {
    const now = Date.now();
    const active: SelectivePressure[] = [];
    for (const pressure of this.pressures.values()) {
      if (now - pressure.timestamp < 60000) {
        active.push(pressure);
      }
    }
    return active;
  }

  applySelectivePressure(currentFitness: number): number {
    const active = this.getActivePressures();
    if (active.length === 0) return currentFitness;

    let totalPressure = 0;
    for (const p of active) {
      totalPressure += p.direction * p.strength * 0.1;
    }

    return Math.max(0, Math.min(1, currentFitness + totalPressure));
  }

  getHistory(): FeedbackEntry[] {
    return [...this.history];
  }

  getRecentFeedback(limit = 5): FeedbackEntry[] {
    return this.history.slice(0, limit);
  }
}
