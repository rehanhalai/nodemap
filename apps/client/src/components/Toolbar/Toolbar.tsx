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
		<div className="flex items-center gap-3 bg-gray-600 mt-2 rounded-lg px-4 py-2 shadow-md sticky top-0 z-10">
			{toolbarTools.map((t) => (
				<Button
					key={t}
					variant={tool === t ? "default" : "outline"}
					onClick={handleToolClick(onToolChange)(t)}
				>
					{t.charAt(0).toUpperCase() + t.slice(1)}
				</Button>
			))}

			<div className="flex items-center gap-3 ml-6">
				<label className="text-sm">Color:</label>
				<Input
					type="color"
					value={brushColor}
					onChange={handleColorChange(onColorChange)}
					className="w-10 h-10 p-0 border-none"
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
