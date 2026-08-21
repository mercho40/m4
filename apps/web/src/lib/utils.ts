import type { ClassValue } from "clsx";
import { cn as tvCn } from "tailwind-variants";

// tailwind-variants bundles its own tailwind-merge engine, so building `cn` on a
// second copy shipped the same logic to the browser twice. The public signature
// stays clsx-shaped (bits-ui types `class` as `ClassValue | null | undefined`),
// which tv's tuple-based `CnOptions` does not express — hence the cast.
export function cn(...inputs: (ClassValue | null | undefined)[]) {
	return tvCn(...(inputs as Parameters<typeof tvCn>)) ?? "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
