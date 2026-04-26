import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const clientFiles = ["apps/client/**/*.{js,jsx,ts,tsx}"];
const scopedNextConfigs = [...nextVitals, ...nextTs].map((config) => ({
	...config,
	files: clientFiles,
	settings: {
		...config.settings,
		next: {
			...(config.settings?.next ?? {}),
			rootDir: "apps/client/",
		},
	},
}));

export default defineConfig([
	globalIgnores([
		"**/.next/**",
		"**/dist/**",
		"**/build/**",
		"**/coverage/**",
		"**/node_modules/**",
		"**/out/**",
		"**/*.d.ts",
	]),
	{
		files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
		},
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ["apps/client/**/*.{js,jsx,ts,tsx}"],
		languageOptions: {
			globals: globals.browser,
		},
		rules: {
			"@next/next/no-html-link-for-pages": "off",
		},
	},
	{
		files: ["apps/server/**/*.{js,jsx,ts,tsx}"],
		languageOptions: {
			globals: globals.node,
		},
	},
	...scopedNextConfigs,
	{
		files: ["apps/client/**/*.{js,jsx,ts,tsx}"],
		rules: {
			"@next/next/no-html-link-for-pages": "off",
		},
	},
]);
