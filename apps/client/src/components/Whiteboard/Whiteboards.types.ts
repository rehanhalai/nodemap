import { TPointerEvent } from "fabric";
import { SocketDetails } from "@/types/global.types";
import { Tool } from "../Toolbar/Toolbar.types";

export type CanvasEventOpts = {
	e: TPointerEvent;
};

export type WhiteboardProps = Record<string, never>;

export type WhiteboardState = {
	tool: Tool;
	brushColor: string;
	brushSize: number;
	socketDetails: SocketDetails;
};

export type ToolOptions = {
	label: string;
	value: Tool;
	icon?: React.ReactNode;
};

export type Point = { x: number; y: number };

export type ShapeBase = {
	id: string;
	color: string;
	size: number;
};
export type FreehandShape = ShapeBase & {
	kind: "draw";
	points: Point[];
};

export type SegmentShape = ShapeBase & {
	kind: "line";
	start: Point;
	end: Point;
};

export type BoxShape = ShapeBase & {
	kind: "rectangle" | "ellipse";
	start: Point;
	end: Point;
};

export type Shape = FreehandShape | SegmentShape | BoxShape;
