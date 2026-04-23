import exrpess from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = exrpess();
const httpServer = createServer(app);
const io = new Server(httpServer, {});

io.on("connection", (socket) => {
  console.log("user connected: ", socket.id);
});

httpServer.listen(8080);
