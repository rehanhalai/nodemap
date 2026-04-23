import exrpess from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = exrpess();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000"],
  },
});

io.on("connection", (socket) => {
  console.log("user connected: ", socket.id);

  socket.on("greeting", (msg) => {
    io.emit("greeting", `Hello from server! Received message: ${msg}`);
  });
});

httpServer.listen(8080);
