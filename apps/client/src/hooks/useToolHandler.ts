import { useCallback, useRef } from "react";
import { Canvas, Rect, Line, Ellipse, TPointerEvent, TPointerEventInfo } from "fabric";
import { Tool } from "../components/Toolbar/Toolbar.types";

// This hook implements the drawing logic for our shape tools:

// Mouse Down: When the user starts drawing, it creates a new shape (rectangle, line, or ellipse) at the starting position.
// Mouse Move: As the user drags the mouse, it updates the shape’s dimensions based on the current pointer position.
// Mouse Up: When the user releases the mouse, it finalizes the shape and adds it to the canvas if it has valid dimensions.

export const useToolHandler = (
	canvas: Canvas | null,
	tool: Tool,
	brushColor: string,
	brushSize: number,
) => {
	const startRef = useRef({ x: 0, y: 0 });
	const shapeRef = useRef<Rect | Line | Ellipse | null>(null);

	const getCanvasPoint = useCallback(
		(event: TPointerEvent) => {
			if (!canvas) return { x: 0, y: 0 };
			const pointerCanvas = canvas as Canvas & {
				getScenePoint?: (evt: TPointerEvent) => { x: number; y: number };
				getPointer?: (evt: TPointerEvent) => { x: number; y: number };
			};
			return (
				pointerCanvas.getScenePoint?.(event) ??
				pointerCanvas.getPointer?.(event) ?? { x: 0, y: 0 }
			);
		},
		[canvas],
	);

	const handleMouseDown = useCallback(
		(opt: TPointerEventInfo<TPointerEvent>) => {
			if (!canvas) return;
			const pointer = getCanvasPoint(opt.e);
			startRef.current = { x: pointer.x, y: pointer.y };
			switch (tool) {
				case "rectangle":
					shapeRef.current = new Rect({
						left: startRef.current.x,
						top: startRef.current.y,
						fill: "transparent",
						stroke: brushColor,
						originX: "left",
						originY: "top",
						strokeWidth: brushSize,
						selectable: false,
						width: 0,
						height: 0,
					});
					break;
				case "line":
					shapeRef.current = new Line(
						[startRef.current.x, startRef.current.y, startRef.current.x, startRef.current.y],
						{
							stroke: brushColor,
							strokeWidth: brushSize,
							selectable: false,
						},
					);
					break;
				case "ellipse":
					shapeRef.current = new Ellipse({
						left: startRef.current.x,
						top: startRef.current.y,
						originX: "left",
						originY: "top",
						rx: 0,
						ry: 0,
						fill: "transparent",
						stroke: brushColor,
						strokeWidth: brushSize,
						selectable: false,
					});
					break;
				default:
					shapeRef.current = null;
					break;
			}
		},
		[canvas, tool, brushColor, brushSize, getCanvasPoint],
	);

	const handleMouseMove = useCallback(
		(opt: TPointerEventInfo<TPointerEvent>) => {
			if (!canvas || !shapeRef.current) return;
			const pointer = getCanvasPoint(opt.e);
			const { x: startX, y: startY } = startRef.current;
			const activeShape = shapeRef.current;
			switch (tool) {
				case "rectangle": {
					const rect = activeShape as Rect;
					rect.set({
						width: Math.abs(pointer.x - startX),
						height: Math.abs(pointer.y - startY),
						left: Math.min(startX, pointer.x),
						top: Math.min(startY, pointer.y),
					});
					break;
				}
				case "line": {
					const line = activeShape as Line;
					line.set({ x2: pointer.x, y2: pointer.y });
					break;
				}
				case "ellipse": {
					const ellipse = activeShape as Ellipse;
					ellipse.set({
						rx: Math.abs(pointer.x - startX) / 2,
						ry: Math.abs(pointer.y - startY) / 2,
						left: Math.min(startX, pointer.x),
						top: Math.min(startY, pointer.y),
					});
					break;
				}
				default:
					break;
			}
			if (activeShape.canvas) {
				canvas.renderAll();
			} else {
				canvas.add(activeShape);
			}
		},
		[canvas, tool, getCanvasPoint],
	);

	const handleMouseUp = useCallback(() => {
		if (!canvas || !shapeRef.current) return;
		const { x: startX, y: startY } = startRef.current;
		const activeShape = shapeRef.current;
		switch (tool) {
			case "rectangle": {
				const rect = activeShape as Rect;
				if (rect.width !== 0 && rect.height !== 0) {
					if (activeShape.canvas) {
						canvas.remove(activeShape);
					}
					rect.set({ selectable: false });
					canvas.add(activeShape);
					canvas.renderAll();
				}
				break;
			}
			case "line": {
				const line = activeShape as Line;
				if (line.x2 !== startX || line.y2 !== startY) {
					if (activeShape.canvas) {
						canvas.remove(activeShape);
					}
					line.set({ selectable: false });
					canvas.add(activeShape);
					canvas.renderAll();
				}
				break;
			}
			case "ellipse": {
				const ellipse = activeShape as Ellipse;
				if (ellipse.rx !== 0 && ellipse.ry !== 0) {
					if (activeShape.canvas) {
						canvas.remove(activeShape);
					}
					ellipse.set({ selectable: false });
					canvas.add(activeShape);
					canvas.renderAll();
				}
				break;
			}
			default:
				break;
		}
		shapeRef.current = null;
	}, [canvas, tool]);

	return { handleMouseDown, handleMouseMove, handleMouseUp };
};
