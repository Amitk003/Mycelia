# P2P Mesh Network

This document explains how the peer-to-peer mesh network works.

## What it does

Multiple browser tabs and devices connect to each other through a mesh network. Each tab is a node in the mesh. They can exchange genetic material and fitness signals without going through a central server.

## Architecture

### Signaling Server
A lightweight WebSocket server that helps peers find each other. It runs on Node.js.

- Location: `signaling-server/src/index.js`
- It assigns each peer a unique ID when they connect
- It relays WebRTC signaling messages between peers (offer/answer/ICE candidates)
- It provides a peer list so new peers know who to connect to

### Peer Manager (Browser)
The `PeerManager` class handles all WebRTC connections from the browser side.

- Location: `src/network/peer-manager.ts`
- Uses `simple-peer` library for WebRTC data channels
- Connects to the signaling server via WebSocket
- Automatically connects to all discovered peers
- Handles disconnection and reconnection
- Provides methods to broadcast packets to all peers

### Signaling Client
The `SignalingClient` class manages the WebSocket connection to the signaling server.

- Location: `src/network/signaling-client.ts`
- Auto-reconnects on disconnect with 3 second delay
- Sends and receives signaling messages
- Requests peer list on connect

### Mesh Types
Shared type definitions for the mesh protocol.

- Location: `src/network/mesh-types.ts`
- Defines packet types: gene_fragment, fitness_broadcast, pheromone, strain_share, ping
- Defines PeerInfo structure with connection metadata
- Defines ConnectionState enum

## How to run

```bash
# Start the signaling server (in one terminal)
cd signaling-server
npm install
npm start

# Start the frontend (in another terminal)
npm run dev
```

Open the app in multiple browser tabs. They will discover each other and form a mesh.

## Packet Types

| Type | Purpose |
|------|---------|
| gene_fragment | Share genetic material with peers |
| fitness_broadcast | Share fitness score with the network |
| pheromone | Digital chemical trail for stigmergy |
| strain_share | Share an entire evolved strain |
| ping | Heartbeat to check connection health |
