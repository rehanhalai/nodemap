import { ExtendedFabricObject } from "@/types/global.types";
import { Canvas, FabricObject } from "fabric";
import { useEffect, useState, useRef } from "react";

const generateId = () =>
	globalThis.crypto?.randomUUID?.() ??
	`shape-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

// Canvas Initialization: It creates a new Fabric.js canvas and sets its dimensions based on the window size.
// Object ID Generation: It extends Fabric.js objects to include unique IDs, which is crucial for real-time synchronization.
// Event Handling: It sets up event listeners for window resizing and keyboard shortcuts (Delete/Backspace to remove selected objects).
// Cleanup: It properly cleans up event listeners and disposes of the canvas when the component unmounts.

export const useCanvas = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);

	useEffect(() => {
		const init = () => {
			const canvasEl = canvasRef.current;
			if (!canvasEl) return;
			FabricObject.prototype.toObject = (function (toObject) {
				return function (this: FabricObject, properties: string[] = []) {
					return toObject.call(this, [...properties, "id"]);
				};
			})(FabricObject.prototype.toObject);
			const canvas = new Canvas(canvasEl, {
				backgroundColor: "#2e2e2e",
			});
			canvas.setDimensions({
				width: window.innerWidth,
				height: window.innerHeight - 80,
			});
			canvas.renderAll();
			canvas.on("object:added", (e: { target: ExtendedFabricObject }) => {
				if (!e.target) return;
				if (!e.target.id) {
					e.target.id = generateId();
				}
			});
			setFabricCanvas(canvas);
			const resize = () => {
				canvas.setDimensions({
					width: window.innerWidth,
					height: window.innerHeight - 80,
				});
				canvas.renderAll();
			};
			const handleKeyDown = (e: KeyboardEvent) => {
				if (e.key === "Delete" || e.key === "Backspace") {
					const active = canvas.getActiveObject();
					if (active) {
						canvas.remove(active);
						canvas.renderAll();
					}
				}
			};
			window.addEventListener("resize", resize);
			window.addEventListener("keydown", handleKeyDown);
			return () => {
				window.removeEventListener("resize", resize);
				window.removeEventListener("keydown", handleKeyDown);
				// Remove canvas event listeners
				canvas.off("object:added");
				if (canvas) {
					canvas.dispose();
					setFabricCanvas(null);
				}
			};
		};
		const cleanup = init();
		return cleanup;
	}, []);
	return { canvasRef, fabricCanvas };
};
