import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFileName(path: string): string {
  return path.split("/").pop() ?? path;
}

export function getFileNameWithoutExt(path: string): string {
  const name = getFileName(path);
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.substring(0, dot) : name;
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export function countChars(text: string): number {
  return text.length;
}
