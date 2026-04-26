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
	socket.on("object:added", (objectData) => {
		socket.broadcast.emit("object:added", objectData);
	});
	socket.on("object:modified", (objectData) => {
		socket.broadcast.emit("object:modified", objectData);
	});
	socket.on("object:removed", (objectData) => {
		socket.broadcast.emit("object:removed", objectData);
	});
	socket.on("canvas:clear", () => {
		socket.broadcast.emit("canvas:clear");
	});
	socket.on("object:sync", (objectsData) => {
		socket.broadcast.emit("object:sync", objectsData);
	});
});

httpServer.listen(8080);
