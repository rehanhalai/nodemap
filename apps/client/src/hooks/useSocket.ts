import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Canvas, util } from "fabric";
import { ExtendedFabricObject, SerializedObjectData, SocketDetails } from "@/types/fabric.types";

const useSocket = (canvas: Canvas | null) => {
	const socketRef = useRef<Socket | null>(null);
	const [socketDetails, setSocketDetails] = useState<SocketDetails | null>(null);

	useEffect(() => {
		const init = async () => {
			if (!canvas) return;
			const socket = await io(process.env.SOCKET_SERVER_URL);
			socketRef.current = socket;
			socket.on("connect", () => {
				setSocketDetails({ clientId: socket.id! });
			});

			// Listen for canvas updates and emit to socket
			const handleObjectAdded = (e: { target: ExtendedFabricObject }) => {
				if (!e.target || e.target.__skipEmit) return;
				socket.emit("object:added", e.target.toJSON());
			};
			const handleObjectModified = (e: { target: ExtendedFabricObject }) => {
				if (!e.target || e.target.__skipEmit) return;
				socket.emit("object:modified", e.target.toJSON());
			};
			const handleObjectRemoved = (e: { target: ExtendedFabricObject }) => {
				if (!e.target || e.target.__skipEmit) return;
				socket.emit("object:removed", e.target.toJSON());
			};
			canvas.on("object:added", handleObjectAdded);
			canvas.on("object:modified", handleObjectModified);
			canvas.on("object:removed", handleObjectRemoved);

			// listen for events from server
		};
	}, []);
};
