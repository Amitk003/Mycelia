import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;

const server = new WebSocketServer({ port: PORT });

server.on("connection", (socket) => {
  console.log("peer connected");

  socket.on("message", (data) => {
    const message = JSON.parse(data.toString());
    console.log("received:", message.type);
  });

  socket.on("close", () => {
    console.log("peer disconnected");
  });
});

console.log("Signaling server running on port", PORT);
