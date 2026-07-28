export type PacketType =
  | "gene_fragment"
  | "fitness_broadcast"
  | "pheromone"
  | "strain_share"
  | "ping"
  | "pong";

export interface NetworkPacket {
  type: PacketType;
  sourcePeerId: string;
  generation: number;
  ttl: number;
  payload: string;
  checksum: number;
  timestamp: number;
}

export interface PeerInfo {
  peerId: string;
  connectedAt: number;
  signalStrength: number;
  geneCount: number;
  fitness: number;
  generation: number;
}

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting";

export interface MeshEvents {
  onPeerConnected: (peer: PeerInfo) => void;
  onPeerDisconnected: (peerId: string) => void;
  onPacket: (packet: NetworkPacket, from: string) => void;
  onStateChange: (state: ConnectionState) => void;
}
