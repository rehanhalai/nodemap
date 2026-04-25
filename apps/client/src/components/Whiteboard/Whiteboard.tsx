"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Toolbar } from "../Toolbar/Toolbar";
import { Tool } from "../Toolbar/Toolbar.types";
import { Point, Shape } from "./Whiteboards.types";

const nextId = () =>
	globalThis.crypto?.randomUUID?.() ??
	`shape-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const toPoint = (
	event: React.PointerEvent<HTMLCanvasElement>,
	canvas: HTMLCanvasElement,
): Point => {
	const rect = canvas.getBoundingClientRect();
	return {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top,
	};
};

export const Whiteboard = () => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const isDrawingRef = useRef(false);
	const activeToolRef = useRef<Exclude<Tool, "clear">>("rectangle");
	const draftShapeRef = useRef<Shape | null>(null);
	const [tool, setTool] = useState<Tool>("rectangle");
	const [brushColor, setBrushColor] = useState("#ffffff");
	const [brushSize, setBrushSize] = useState(6);
	const [shapes, setShapes] = useState<Shape[]>([]);
	const [draftShape, setDraftShape] = useState<Shape | null>(null);

	const toolbarTool = useMemo(() => tool, [tool]);

	useEffect(() => {
		if (tool === "clear") {
			setShapes([]);
			setDraftShape(null);
			setTool(activeToolRef.current);
			return;
		}
		if (tool == "undo") {
			setShapes((prev) => prev.slice(0, -1));
		}
		if (tool !== "select") {
			activeToolRef.current = tool;
		}
	}, [tool]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const resize = () => {
			const rect = canvas.getBoundingClientRect();
			const scale = window.devicePixelRatio || 1;
			canvas.width = Math.max(1, Math.round(rect.width * scale));
			canvas.height = Math.max(1, Math.round(rect.height * scale));
			const context = canvas.getContext("2d");
			if (!context) return;
			context.setTransform(scale, 0, 0, scale, 0, 0);
			context.clearRect(0, 0, rect.width, rect.height);
		};

		resize();
		window.addEventListener("resize", resize);
		return () => window.removeEventListener("resize", resize);
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const context = canvas.getContext("2d");
		if (!context) return;

		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		const scale = window.devicePixelRatio || 1;
		context.setTransform(scale, 0, 0, scale, 0, 0);
		context.clearRect(0, 0, width, height);

		const drawShape = (shape: Shape) => {
			context.strokeStyle = shape.color;
			context.fillStyle = shape.kind === "ellipse" ? `${shape.color}22` : "transparent";
			context.lineWidth = shape.size;
			context.lineJoin = "round";
			context.lineCap = "round";

			if (shape.kind === "draw") {
				if (shape.points.length < 2) return;
				context.beginPath();
				context.moveTo(shape.points[0].x, shape.points[0].y);
				shape.points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
				context.stroke();
				return;
			}

			const left = Math.min(shape.start.x, shape.end.x);
			const top = Math.min(shape.start.y, shape.end.y);
			const width = Math.abs(shape.end.x - shape.start.x);
			const height = Math.abs(shape.end.y - shape.start.y);

			context.beginPath();
			if (shape.kind === "line") {
				context.moveTo(shape.start.x, shape.start.y);
				context.lineTo(shape.end.x, shape.end.y);
				context.stroke();
				return;
			}

			if (shape.kind === "rectangle") {
				context.strokeRect(left, top, width, height);
				return;
			}

			const radiusX = width / 2;
			const radiusY = height / 2;
			const centerX = left + radiusX;
			const centerY = top + radiusY;
			context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
			context.fill();
			context.stroke();
		};

		context.fillStyle = "#121212";
		context.fillRect(0, 0, width, height);
		shapes.forEach(drawShape);
		if (draftShape) {
			drawShape(draftShape);
		}
	}, [shapes, draftShape]);

	const updateDraft = (shape: Shape | null) => {
		draftShapeRef.current = shape;
		setDraftShape(shape);
	};

	const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas || tool === "select") return;

		const point = toPoint(event, canvas);
		isDrawingRef.current = true;

		if (tool === "draw") {
			updateDraft({
				id: nextId(),
				kind: "draw",
				color: brushColor,
				size: brushSize,
				points: [point],
			});
			return;
		}

		const shapeKind: "rectangle" | "ellipse" = tool === "ellipse" ? "ellipse" : "rectangle";
		updateDraft(
			tool === "line"
				? {
						id: nextId(),
						kind: "line",
						color: brushColor,
						size: brushSize,
						start: point,
						end: point,
					}
				: {
						id: nextId(),
						kind: shapeKind,
						color: brushColor,
						size: brushSize,
						start: point,
						end: point,
					},
		);
	};

	const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
		if (!isDrawingRef.current || !draftShapeRef.current) return;
		const canvas = canvasRef.current;
		if (!canvas) return;

		const point = toPoint(event, canvas);
		const current = draftShapeRef.current;

		if (current.kind === "draw") {
			updateDraft({ ...current, points: [...current.points, point] });
			return;
		}

		updateDraft({ ...current, end: point });
	};

	const finishShape = () => {
		if (!isDrawingRef.current || !draftShapeRef.current) return;
		const current = draftShapeRef.current;
		isDrawingRef.current = false;

		if (current.kind === "draw") {
			if (current.points.length > 1) {
				setShapes((previous) => [...previous, current]);
			}
			updateDraft(null);
			return;
		}

		const isValid =
			current.kind === "line"
				? current.start.x !== current.end.x || current.start.y !== current.end.y
				: current.start.x !== current.end.x || current.start.y !== current.end.y;

		if (isValid) {
			setShapes((previous) => [...previous, current]);
		}
		updateDraft(null);
	};

	return (
		<main className="min-h-screen min-w-screen">
			<div className="mx-auto flex h-screen w-screen flex-col overflow-hidden">
				<div className="absolute">
					<Toolbar
						tool={toolbarTool}
						brushColor={brushColor}
						brushSize={brushSize}
						onToolChange={setTool}
						onColorChange={setBrushColor}
						onSizeChange={setBrushSize}
					/>
				</div>

				<canvas
					ref={canvasRef}
					className="h-screen w-screen touch-none"
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={finishShape}
					onPointerLeave={finishShape}
				/>
				<div className="pointer-events-none absolute bottom-7 left-7 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
					{tool === "select" ? "Select mode" : `${tool} mode`}
				</div>
			</div>
		</main>
	);
};
