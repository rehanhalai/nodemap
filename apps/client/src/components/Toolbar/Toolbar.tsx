import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toolbarTools } from "./Toolbar.types";

type ToolbarProps = {
	tool: (typeof toolbarTools)[number];
	brushColor: string;
	brushSize: number;
	onToolChange: (tool: (typeof toolbarTools)[number]) => void;
	onColorChange: (color: string) => void;
	onSizeChange: (size: number) => void;
};

const handleToolClick =
	(onToolChange: ToolbarProps["onToolChange"]) => (tool: ToolbarProps["tool"]) => () =>
		onToolChange(tool);

const handleColorChange =
	(onColorChange: ToolbarProps["onColorChange"]) => (event: React.ChangeEvent<HTMLInputElement>) =>
		onColorChange(event.target.value);

const handleSizeChange = (onSizeChange: ToolbarProps["onSizeChange"]) => (value: number[]) =>
	onSizeChange(value[0]);

export const Toolbar = ({
	tool,
	brushColor = "#d8d8d8",
	brushSize,
	onToolChange,
	onColorChange,
	onSizeChange,
}: ToolbarProps) => {
	return (
		<div className="pointer-events-auto inline-flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white shadow-2xl shadow-black/30 backdrop-blur-xl">
			{toolbarTools.map((t) => (
				<Button
					key={t}
					variant={tool === t ? "default" : "outline"}
					onClick={handleToolClick(onToolChange)(t)}
				>
					{t.charAt(0).toUpperCase() + t.slice(1)}
				</Button>
			))}

			<div className="ml-2 flex items-center gap-3 sm:ml-4">
				<label className="text-sm">Color:</label>
				<Input
					type="color"
					value={brushColor}
					onChange={handleColorChange(onColorChange)}
					className="h-10 w-10 border-none p-0"
				/>
				<label className="text-sm">Size:</label>
				<Slider
					min={1}
					max={7}
					step={2}
					value={[brushSize]}
					onValueChange={handleSizeChange(onSizeChange)}
				/>
			</div>
		</div>
	);
};
