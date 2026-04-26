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

const objectLocks = new Map<string, string>();

io.on("connection", (socket) => {
	socket.emit(
		"object:locks:sync",
		Array.from(objectLocks.entries()).map(([objectId, lockedBy]) => ({
			objectId,
			lockedBy,
		})),
	);

	socket.on("object:added", (objectData) => {
		socket.broadcast.emit("object:added", objectData);
	});
	socket.on("object:modified", (objectData) => {
		socket.broadcast.emit("object:modified", objectData);
	});
	socket.on("object:removed", (objectData) => {
		objectLocks.delete(objectData.id);
		socket.broadcast.emit("object:unlocked", { objectId: objectData.id });
		socket.broadcast.emit("object:removed", objectData);
	});
	socket.on("canvas:clear", () => {
		Array.from(objectLocks.entries()).forEach(([objectId]) => {
			objectLocks.delete(objectId);
			socket.broadcast.emit("object:unlocked", { objectId });
		});
		socket.broadcast.emit("canvas:clear");
	});
	socket.on("object:sync", (objectsData) => {
		socket.broadcast.emit("object:sync", objectsData);
	});
	socket.on("object:lock:request", ({ objectId }) => {
		const lockedBy = objectLocks.get(objectId);
		if (!lockedBy || lockedBy === socket.id) {
			objectLocks.set(objectId, socket.id);
			io.emit("object:locked", { objectId, lockedBy: socket.id });
			return;
		}

		socket.emit("object:lock:denied", { objectId, lockedBy });
	});
	socket.on("object:unlock:request", ({ objectId }) => {
		if (objectLocks.get(objectId) !== socket.id) return;
		objectLocks.delete(objectId);
		io.emit("object:unlocked", { objectId });
	});
	socket.on("disconnect", () => {
		Array.from(objectLocks.entries()).forEach(([objectId, lockedBy]) => {
			if (lockedBy !== socket.id) return;
			objectLocks.delete(objectId);
			io.emit("object:unlocked", { objectId });
		});
	});
});

httpServer.listen(8080);
