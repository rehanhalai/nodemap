import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Canvas, util } from "fabric";
import { ExtendedFabricObject, SerializedObjectData, SocketDetails } from "@/types/global.types";

export const useSocket = (canvas: Canvas | null) => {
	const socketRef = useRef<Socket | null>(null);
	const lockedObjectsRef = useRef(new Map<string, string>());
	const [socketDetails, setSocketDetails] = useState<SocketDetails | null>(null);

	const requestObjectLock = useCallback((objectId: string) => {
		socketRef.current?.emit("object:lock:request", { objectId });
	}, []);

	const releaseObjectLock = useCallback((objectId: string) => {
		socketRef.current?.emit("object:unlock:request", { objectId });
	}, []);

	useEffect(() => {
		const socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL);
		socketRef.current = socket;

		const handleConnect = () => {
			setSocketDetails({ clientId: socket.id! });
		};

		socket.on("connect", handleConnect);

		return () => {
			socket.off("connect", handleConnect);
			if (socketRef.current) {
				socketRef.current.disconnect();
				socketRef.current = null;
				setSocketDetails(null);
			}
		};
	}, []);

	useEffect(() => {
		const socket = socketRef.current;
		if (!canvas || !socket) return;
		const currentClientId = socketDetails?.clientId;

		const applyLockState = (objectId: string, lockedBy: string | null) => {
			const object = canvas
				.getObjects()
				.find((item) => (item as ExtendedFabricObject).id === objectId) as
				| ExtendedFabricObject
				| undefined;
			if (!object) return;

			if (lockedBy) {
				lockedObjectsRef.current.set(objectId, lockedBy);
			} else {
				lockedObjectsRef.current.delete(objectId);
			}

			object.lockedBy = lockedBy;
			const isLockedByOther = Boolean(lockedBy && lockedBy !== currentClientId);
			const canInteract = canvas.selection && !isLockedByOther;
			object.selectable = canInteract;
			object.evented = canInteract;

			if (isLockedByOther) {
				const activeObject = canvas.getActiveObject() as ExtendedFabricObject | null;
				const activeObjects = canvas.getActiveObjects() as ExtendedFabricObject[];
				const isActivelySelected =
					activeObject?.id === objectId ||
					activeObjects.some((active) => active.id === objectId);

				if (isActivelySelected) {
					canvas.discardActiveObject();
				}
			}

			canvas.requestRenderAll();
		};

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

		// Listen for events from server
		const handleRemoteObjectAdded = (objectData: SerializedObjectData) => {
			util
				.enlivenObjects([objectData])
				.then(([obj]) => {
					const extendedObj = obj as ExtendedFabricObject;
					if (
						!canvas
							.getObjects()
							.find((o) => (o as ExtendedFabricObject).id === extendedObj.id)
					) {
						extendedObj.__skipEmit = true;
						canvas.add(extendedObj);
						applyLockState(
							extendedObj.id,
							lockedObjectsRef.current.get(extendedObj.id) ?? null,
						);
						canvas.renderAll();
					}
				})
				.catch(console.error);
		};

		const handleRemoteObjectModified = (objectData: SerializedObjectData) => {
			const obj = canvas
				.getObjects()
				.find((o) => (o as ExtendedFabricObject).id === objectData.id) as
				| ExtendedFabricObject
				| undefined;
			if (obj) {
				obj.__skipEmit = true;
				obj.set({ ...objectData });
				canvas.renderAll();
			}
		};

		const handleRemoteObjectRemoved = (objectData: SerializedObjectData) => {
			const obj = canvas
				.getObjects()
				.find((o) => (o as ExtendedFabricObject).id === objectData.id) as
				| ExtendedFabricObject
				| undefined;
			if (obj) {
				obj.__skipEmit = true;
				canvas.remove(obj);
				canvas.renderAll();
			}
		};

		const handleRemoteCanvasClear = () => {
			lockedObjectsRef.current.clear();
			canvas.clear();
			canvas.renderAll();
		};

		const handleRemoteObjectLocked = ({
			objectId,
			lockedBy,
		}: {
			objectId: string;
			lockedBy: string;
		}) => {
			applyLockState(objectId, lockedBy);
		};

		const handleRemoteObjectUnlocked = ({ objectId }: { objectId: string }) => {
			applyLockState(objectId, null);
		};

		const handleRemoteObjectLockDenied = ({ objectId }: { objectId: string }) => {
			const activeObject = canvas.getActiveObject() as ExtendedFabricObject | null;
			const activeObjects = canvas.getActiveObjects() as ExtendedFabricObject[];
			const isActivelySelected =
				activeObject?.id === objectId || activeObjects.some((active) => active.id === objectId);

			if (isActivelySelected) {
				canvas.discardActiveObject();
				canvas.requestRenderAll();
			}
		};

		const handleRemoteLocksSync = (locks: Array<{ objectId: string; lockedBy: string }>) => {
			locks.forEach(({ objectId, lockedBy }) => {
				applyLockState(objectId, lockedBy);
			});
		};

		const handleRemoteObjectSync = (payload: { objects: SerializedObjectData[] }) => {
			util.enlivenObjects(payload.objects).then((objects) => {
				const currentLocks = lockedObjectsRef.current;
				canvas.clear();
				objects.forEach((obj) => {
					const extendedObj = obj as ExtendedFabricObject;
					extendedObj.__skipEmit = true;
					canvas.add(extendedObj);
					applyLockState(extendedObj.id, currentLocks.get(extendedObj.id) ?? null);
				});
				canvas.renderAll();
			});
		};

		canvas.on("object:added", handleObjectAdded);
		canvas.on("object:modified", handleObjectModified);
		canvas.on("object:removed", handleObjectRemoved);
		socket.on("object:added", handleRemoteObjectAdded);
		socket.on("object:modified", handleRemoteObjectModified);
		socket.on("object:removed", handleRemoteObjectRemoved);
		socket.on("canvas:clear", handleRemoteCanvasClear);
		socket.on("object:locked", handleRemoteObjectLocked);
		socket.on("object:unlocked", handleRemoteObjectUnlocked);
		socket.on("object:lock:denied", handleRemoteObjectLockDenied);
		socket.on("object:locks:sync", handleRemoteLocksSync);
		socket.on("object:sync", handleRemoteObjectSync);

		return () => {
			canvas.off("object:added", handleObjectAdded);
			canvas.off("object:modified", handleObjectModified);
			canvas.off("object:removed", handleObjectRemoved);
			socket.off("object:added", handleRemoteObjectAdded);
			socket.off("object:modified", handleRemoteObjectModified);
			socket.off("object:removed", handleRemoteObjectRemoved);
			socket.off("canvas:clear", handleRemoteCanvasClear);
			socket.off("object:locked", handleRemoteObjectLocked);
			socket.off("object:unlocked", handleRemoteObjectUnlocked);
			socket.off("object:lock:denied", handleRemoteObjectLockDenied);
			socket.off("object:locks:sync", handleRemoteLocksSync);
			socket.off("object:sync", handleRemoteObjectSync);
		};
	}, [canvas, socketDetails?.clientId]);

	const emitCanvasClear = () => {
		socketRef.current?.emit("canvas:clear");
	};

	return { socketDetails, emitCanvasClear, requestObjectLock, releaseObjectLock };
};
