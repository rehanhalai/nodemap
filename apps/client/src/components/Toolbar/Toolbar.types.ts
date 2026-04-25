export const toolbarTools = [
	"draw",
	"select",
	"rectangle",
	"line",
	"ellipse",
	"clear",
	"undo",
] as const;

export type Tool = (typeof toolbarTools)[number];

export type ToolbarProps = {
	tool: Tool;
	brushColor: string;
	brushSize: number;
	onToolChange: (tool: Tool) => void;
	onColorChange: (color: string) => void;
	onSizeChange: (size: number) => void;
};
