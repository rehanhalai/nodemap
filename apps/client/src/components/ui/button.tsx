import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const buttonVariants: Record<ButtonVariant, string> = {
	default: "bg-slate-900 text-white shadow-sm hover:bg-slate-800",
	destructive: "bg-red-600 text-white shadow-sm hover:bg-red-500",
	outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
	secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300",
	ghost: "bg-transparent text-slate-800 hover:bg-slate-100",
	link: "bg-transparent text-slate-900 underline-offset-4 hover:underline",
};

const buttonSizes: Record<ButtonSize, string> = {
	default: "h-9 px-4 py-2",
	sm: "h-8 px-3 text-sm",
	lg: "h-10 px-6",
	icon: "h-9 w-9",
};

function Button({
	className,
	variant = "default",
	size = "default",
	...props
}: React.ComponentProps<"button"> & {
	variant?: ButtonVariant;
	size?: ButtonSize;
	asChild?: boolean;
}) {
	return (
		<button
			data-slot="button"
			className={cn(
				"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
				buttonVariants[variant],
				buttonSizes[size],
				className,
			)}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
