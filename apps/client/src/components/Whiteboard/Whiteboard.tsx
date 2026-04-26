"use client";

import { useCallback, useEffect, useState } from "react";
import { PencilBrush } from "fabric";
import { Toolbar } from "../Toolbar/Toolbar";
import { Tool } from "../Toolbar/Toolbar.types";
import { useCanvas } from "@/hooks/useCanvas";
import { useToolHandler } from "@/hooks/useToolHandler";
import { shortcutMap } from "./Whiteboards.types";
import { useSocket } from "@/hooks/useSocket";

export const Whiteboard = () => {
	const { canvasRef, fabricCanvas } = useCanvas();
	const [tool, setTool] = useState<Tool>("rectangle");
	const [brushColor, setBrushColor] = useState("#d8d8d8");
	const [brushSize, setBrushSize] = useState(3);

	const scoket = useSocket(fabricCanvas);

	const { handleMouseDown, handleMouseMove, handleMouseUp } = useToolHandler(
		fabricCanvas,
		tool,
		brushColor,
		brushSize,
	);

	const undoLastObject = useCallback(() => {
		if (!fabricCanvas) return;
		const objects = fabricCanvas.getObjects();
		const lastObject = objects[objects.length - 1];
		if (!lastObject) return;
		fabricCanvas.remove(lastObject);
		fabricCanvas.renderAll();
	}, [fabricCanvas]);

	const clearCanvas = useCallback(() => {
		if (!fabricCanvas) return;
		fabricCanvas.clear();
		fabricCanvas.renderAll();
	}, [fabricCanvas]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			if (
				target &&
				(target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					target.isContentEditable)
			)
				return;

			if (event.ctrlKey && event.key.toLowerCase() === "z") {
				event.preventDefault();
				undoLastObject();
				return;
			}

			const nextTool = shortcutMap[event.key];
			if (nextTool) {
				setTool(nextTool);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [undoLastObject]);

	useEffect(() => {
		if (!fabricCanvas) return;

		fabricCanvas.set({ isDrawingMode: false, selection: false });
		fabricCanvas.off("mouse:down", handleMouseDown);
		fabricCanvas.off("mouse:move", handleMouseMove);
		fabricCanvas.off("mouse:up", handleMouseUp);

		switch (tool) {
			case "draw": {
				fabricCanvas.set({ isDrawingMode: true });
				const brush = new PencilBrush(fabricCanvas);
				brush.color = brushColor;
				brush.width = brushSize;
				fabricCanvas.set("freeDrawingBrush", brush);
				break;
			}
			case "select": {
				fabricCanvas.set({ selection: true });
				fabricCanvas.forEachObject((obj) => {
					obj.selectable = true;
				});
				break;
			}
			case "rectangle":
			case "line":
			case "ellipse": {
				fabricCanvas.forEachObject((obj) => {
					obj.selectable = false;
				});
				fabricCanvas.on("mouse:down", handleMouseDown);
				fabricCanvas.on("mouse:move", handleMouseMove);
				fabricCanvas.on("mouse:up", handleMouseUp);
				break;
			}
			default:
				break;
		}

		return () => {
			if (!fabricCanvas) return;
			fabricCanvas.off("mouse:down", handleMouseDown);
			fabricCanvas.off("mouse:move", handleMouseMove);
			fabricCanvas.off("mouse:up", handleMouseUp);
		};
	}, [tool, brushColor, brushSize, fabricCanvas, handleMouseDown, handleMouseMove, handleMouseUp]);

	const handleToolChange = (nextTool: Tool) => {
		switch (nextTool) {
			case "clear":
				clearCanvas();
				break;
			case "undo":
				undoLastObject();
				break;
			default:
				setTool(nextTool);
		}
	};

	return (
		<main className="min-h-screen min-w-screen bg-[#121212]">
			<div className="mx-auto flex h-screen w-screen flex-col overflow-hidden">
				<div className="absolute p-2">
					<Toolbar
						tool={tool}
						brushColor={brushColor}
						brushSize={brushSize}
						onToolChange={handleToolChange}
						onColorChange={setBrushColor}
						onSizeChange={setBrushSize}
					/>
				</div>

				<canvas ref={canvasRef} className="h-screen w-screen touch-none" />
				<div className="pointer-events-none absolute bottom-7 left-7 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
					{tool === "select" ? "Select mode" : `${tool} mode`}
				</div>
			</div>
		</main>
	);
};
