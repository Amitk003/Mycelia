import SimplePeer from "simple-peer";
import { SignalingClient } from "./signaling-client";
import type { PeerInfo, ConnectionState, NetworkPacket } from "./mesh-types";

export interface PeerManagerEvents {
  onPeersChanged: (peers: Map<string, PeerInfo>) => void;
  onStateChange: (state: ConnectionState) => void;
  onPacket: (packet: NetworkPacket, from: string) => void;
}

export class PeerManager {
  private signalingClient: SignalingClient;
  private peers: Map<string, { connection: SimplePeer.Instance; info: PeerInfo }> = new Map();
  private myPeerId = "";
  private events: PeerManagerEvents;
  private state: ConnectionState = "disconnected";

  constructor(signalingUrl: string, events: PeerManagerEvents) {
    this.events = events;
    this.signalingClient = new SignalingClient(signalingUrl, {
      onWelcome: (peerId) => {
        this.myPeerId = peerId;
        this.signalingClient.requestPeerList();
        this.setState("connected");
      },
      onSignal: (from, signal) => {
        this.handleIncomingSignal(from, signal);
      },
      onPeerList: (peers) => {
        for (const peerId of peers) {
          if (!this.peers.has(peerId)) {
            this.initiateConnection(peerId);
          }
        }
      },
      onStateChange: (state) => {
        if (state === "connected" && this.myPeerId) {
          this.signalingClient.requestPeerList();
        }
        this.setState(state);
      },
      onError: (message) => {
        console.error("Signaling error:", message);
      },
    });
  }

  connect(): void {
    this.signalingClient.connect();
  }

  disconnect(): void {
    this.signalingClient.disconnect();
    for (const [peerId] of this.peers) {
      this.removePeer(peerId);
    }
  }

  getPeerId(): string {
    return this.myPeerId;
  }

  getPeers(): Map<string, PeerInfo> {
    const result = new Map<string, PeerInfo>();
    for (const [id, { info }] of this.peers) {
      result.set(id, info);
    }
    return result;
  }

  getState(): ConnectionState {
    return this.state;
  }

  broadcast(packet: NetworkPacket): void {
    packet.sourcePeerId = this.myPeerId;
    const payload = JSON.stringify(packet);
    for (const [peerId, { connection }] of this.peers) {
      try {
        if (connection && !connection.destroyed) {
          connection.send(payload);
        }
      } catch (err) {
        console.error(`Failed to send to ${peerId}:`, err);
        this.removePeer(peerId);
      }
    }
  }

  private initiateConnection(peerId: string): void {
    const connection = new SimplePeer({ initiator: true, trickle: false });

    connection.on("signal", (signal: string) => {
      this.signalingClient.sendSignal(peerId, JSON.stringify(signal));
    });

    connection.on("connect", () => {
      const info: PeerInfo = {
        peerId,
        connectedAt: Date.now(),
        signalStrength: 1.0,
        geneCount: 0,
        fitness: 0,
        generation: 0,
      };
      this.peers.set(peerId, { connection, info });
      this.events.onPeersChanged(this.getPeers());
    });

    connection.on("data", (data: Uint8Array | string) => {
      try {
        const raw = typeof data === "string" ? data : new TextDecoder().decode(data);
        const packet: NetworkPacket = JSON.parse(raw);
        this.events.onPacket(packet, peerId);
      } catch {
        // ignore malformed packets
      }
    });

    connection.on("close", () => {
      this.removePeer(peerId);
    });

    connection.on("error", (err: Error) => {
      console.error(`Connection error with ${peerId}:`, err.message);
      this.removePeer(peerId);
    });
  }

  private handleIncomingSignal(from: string, signal: string): void {
    if (this.peers.has(from)) return;

    let parsedSignal: string | SimplePeer.SignalData;
    try {
      parsedSignal = JSON.parse(signal);
    } catch {
      parsedSignal = signal;
    }

    const connection = new SimplePeer({ initiator: false, trickle: false });

    connection.on("signal", (signal: string) => {
      this.signalingClient.sendSignal(from, JSON.stringify(signal));
    });

    connection.on("connect", () => {
      const info: PeerInfo = {
        peerId: from,
        connectedAt: Date.now(),
        signalStrength: 1.0,
        geneCount: 0,
        fitness: 0,
        generation: 0,
      };
      this.peers.set(from, { connection, info });
      this.events.onPeersChanged(this.getPeers());
    });

    connection.on("data", (data: Uint8Array | string) => {
      try {
        const raw = typeof data === "string" ? data : new TextDecoder().decode(data);
        const packet: NetworkPacket = JSON.parse(raw);
        this.events.onPacket(packet, from);
      } catch {
        // ignore malformed packets
      }
    });

    connection.on("close", () => {
      this.removePeer(from);
    });

    connection.on("error", (err: Error) => {
      console.error(`Connection error with ${from}:`, err.message);
      this.removePeer(from);
    });

    try {
      connection.signal(parsedSignal);
    } catch (err) {
      console.error(`Failed to signal ${from}:`, err);
    }
  }

  private removePeer(peerId: string): void {
    const existing = this.peers.get(peerId);
    if (existing) {
      try {
        if (!existing.connection.destroyed) {
          existing.connection.destroy();
        }
      } catch {
        // ignore destroy errors
      }
      this.peers.delete(peerId);
      this.events.onPeersChanged(this.getPeers());
    }
  }

  private setState(state: ConnectionState): void {
    this.state = state;
    this.events.onStateChange(state);
  }
}
