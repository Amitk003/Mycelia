import type { ConnectionState } from "./mesh-types";

export interface SignalingEvents {
  onWelcome: (peerId: string) => void;
  onSignal: (from: string, signal: string) => void;
  onPeerList: (peers: string[]) => void;
  onStateChange: (state: ConnectionState) => void;
  onError: (message: string) => void;
}

export class SignalingClient {
  private ws: WebSocket | null = null;
  private url: string;
  private events: SignalingEvents;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;

  constructor(url: string, events: SignalingEvents) {
    this.url = url;
    this.events = events;
  }

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.events.onStateChange("connecting");
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.events.onStateChange("connected");
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case "welcome":
              this.events.onWelcome(msg.peerId);
              break;
            case "signal":
              this.events.onSignal(msg.from, msg.signal);
              break;
            case "peer_list":
              this.events.onPeerList(msg.peers);
              break;
            case "error":
              this.events.onError(msg.message);
              break;
          }
        } catch {
          // ignore non-json messages
        }
      };

      this.ws.onerror = () => {
        this.events.onStateChange("disconnected");
      };

      this.ws.onclose = () => {
        this.events.onStateChange("disconnected");
        if (this.shouldReconnect) {
          this.reconnectTimer = setTimeout(() => this.connect(), 3000);
        }
      };
    } catch (err) {
      this.events.onStateChange("disconnected");
      console.error("Signaling connection failed:", err);
    }
  }

  sendSignal(target: string, signal: string): void {
    this.send({ type: "signal", target, signal });
  }

  requestPeerList(): void {
    this.send({ type: "peer_list" });
  }

  private send(data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.events.onStateChange("disconnected");
  }
}
