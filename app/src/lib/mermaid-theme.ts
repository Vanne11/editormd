import mermaid from "mermaid";
import type { Theme } from "@/types";

export const mermaidThemeMap: Record<Theme, "dark" | "default" | "neutral"> = {
  dark: "dark",
  light: "default",
  sepia: "neutral",
  pastel: "default",
  dracula: "dark",
  alucard: "dark",
};

/** Inicializa mermaid con el tema de la app. Compartido por preview, WYSIWYG y export. */
export function initMermaid(appTheme: Theme) {
  mermaid.initialize({
    startOnLoad: false,
    theme: mermaidThemeMap[appTheme] || "dark",
    securityLevel: "loose",
    flowchart: { htmlLabels: false },
    sequence: { useMaxWidth: false },
  });
}
