import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Canvas, util } from "fabric";
import { ExtendedFabricObject, SerializedObjectData, SocketDetails } from "@/types/global.types";

export const useSocket = (canvas: Canvas | null) => {
	const socketRef = useRef<Socket | null>(null);
	const [socketDetails, setSocketDetails] = useState<SocketDetails | null>(null);

	useEffect(() => {
		const init = async () => {
			if (!canvas) return;
			const socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL);
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

			socket.on("object:added", (ObjectData: SerializedObjectData) => {
				util
					.enlivenObjects([ObjectData])
					.then(([obj]) => {
						const extendedObj = obj as ExtendedFabricObject;
						if (
							!canvas
								.getObjects()
								.find((o) => (o as ExtendedFabricObject).id === extendedObj.id)
						) {
							extendedObj.__skipEmit = true;
							canvas.add(extendedObj);
							canvas.renderAll();
						}
					})
					.catch(console.error);
			});
			socket.on("object:modified", (objectData: SerializedObjectData) => {
				const obj = canvas
					.getObjects()
					.find(
						(o) => (o as ExtendedFabricObject).id === objectData.id,
					) as ExtendedFabricObject;
				if (obj) {
					obj.__skipEmit = true;
					obj.set({ ...objectData });
					canvas.renderAll();
				}
			});
			socket.on("object:removed", (objectData: SerializedObjectData) => {
				const obj = canvas
					.getObjects()
					.find(
						(o) => (o as ExtendedFabricObject).id === objectData.id,
					) as ExtendedFabricObject;
				if (obj) {
					obj.__skipEmit = true;
					canvas.remove(obj);
					canvas.renderAll();
				}
			});
			socket.on("canvas:clear", () => {
				canvas.clear();
			});
			socket.on("object:sync", (payload: { objects: SerializedObjectData[] }) => {
				util.enlivenObjects(payload.objects).then((objects) => {
					canvas.clear();
					objects.forEach((obj) => {
						const extendedObj = obj as ExtendedFabricObject;
						extendedObj.__skipEmit = true;
						canvas.add(extendedObj);
					});
					canvas.renderAll();
				});
			});
			return () => {
				// Remove canvas event listeners
				canvas.off("object:added", handleObjectAdded);
				canvas.off("object:modified", handleObjectModified);
				canvas.off("object:removed", handleObjectRemoved);
				// Remove socket event listeners
				socket.off("object:added");
				socket.off("object:removed");
				socket.off("object:modified");
				socket.off("object:sync");
				if (socketRef.current) {
					socketRef.current.disconnect();
					socketRef.current = null;
				}
			};
		};
		init();
	}, [canvas]);
	return { socketDetails };
};
