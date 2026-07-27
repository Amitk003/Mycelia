import { WebSocketServer, WebSocket } from "ws";

const PORT = process.env.PORT || 8080;

const server = new WebSocketServer({ port: PORT });

server.on("connection", (socket) => {
  console.log("peer connected");

  socket.on("message", (data) => {
    // Relay signaling messages to all other connected peers
    server.clients.forEach((client) => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });

  socket.on("close", () => {
    console.log("peer disconnected");
  });
});

console.log("Signaling server running on port", PORT);
