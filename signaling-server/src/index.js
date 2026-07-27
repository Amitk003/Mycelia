import { WebSocketServer, WebSocket } from "ws";

const PORT = process.env.PORT || 8080;

const server = new WebSocketServer({ port: PORT });
const peers = new Map();
let nextPeerId = 1;

server.on("connection", (socket) => {
  const peerId = `peer_${nextPeerId++}`;
  peers.set(peerId, socket);
  console.log(`peer connected: ${peerId} (total: ${peers.size})`);

  socket.send(JSON.stringify({ type: "welcome", peerId }));

  socket.on("message", (data) => {
    try {
      const raw = data.toString();
      let message;
      try {
        message = JSON.parse(raw);
      } catch {
        socket.send(JSON.stringify({ type: "error", message: "invalid JSON" }));
        return;
      }

      if (message.type === "signal" && message.target) {
        const targetSocket = peers.get(message.target);
        if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
          targetSocket.send(JSON.stringify({
            type: "signal",
            from: peerId,
            signal: message.signal,
          }));
        } else {
          socket.send(JSON.stringify({ type: "error", message: "target peer not found" }));
        }
      } else if (message.type === "peer_list") {
        const peerList = Array.from(peers.keys()).filter((id) => id !== peerId);
        socket.send(JSON.stringify({ type: "peer_list", peers: peerList }));
      } else {
        server.clients.forEach((client) => {
          if (client !== socket && client.readyState === WebSocket.OPEN) {
            client.send(data);
          }
        });
      }
    } catch (err) {
      console.error("error processing message:", err);
      socket.send(JSON.stringify({ type: "error", message: "internal error" }));
    }
  });

  socket.on("close", () => {
    peers.delete(peerId);
    console.log(`peer disconnected: ${peerId} (total: ${peers.size})`);
  });

  socket.on("error", (err) => {
    console.error(`socket error for ${peerId}:`, err.message);
    peers.delete(peerId);
  });
});

server.on("error", (err) => {
  console.error("server error:", err.message);
});

console.log("Signaling server running on port", PORT);
