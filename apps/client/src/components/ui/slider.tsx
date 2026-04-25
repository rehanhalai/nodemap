"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function Slider({
	className,
	value,
	min = 0,
	max = 100,
	step = 1,
	defaultValue,
	onValueChange,
	...props
}: Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type"> & {
	value?: number[];
	defaultValue?: number[];
	onValueChange?: (value: number[]) => void;
}) {
	const currentValue = Array.isArray(value)
		? value[0]
		: Array.isArray(defaultValue)
			? defaultValue[0]
			: min;

	return (
		<div className={cn("flex w-full items-center", className)} data-slot="slider">
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={currentValue}
				className="h-2 w-full cursor-pointer accent-slate-900"
				onChange={(event) => onValueChange?.([Number(event.target.value)])}
				{...props}
			/>
		</div>
	);
}

export { Slider };
