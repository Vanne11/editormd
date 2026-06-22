import mermaid from "mermaid";
import { initMermaid } from "@/lib/mermaid-theme";
import type { Theme } from "@/types";

/**
 * Convierte foreignObject (HTML) a elementos SVG <text> nativos
 * para que resvg pueda renderizar el texto correctamente.
 */
function convertForeignObjectToText(svg: SVGElement): void {
  const foreignObjects = svg.querySelectorAll("foreignObject");

  foreignObjects.forEach((fo) => {
    // Extraer texto del HTML dentro del foreignObject
    const textContent = fo.textContent?.trim() || "";
    if (!textContent) {
      fo.remove();
      return;
    }

    // Obtener posición y dimensiones del foreignObject
    const x = parseFloat(fo.getAttribute("x") || "0");
    const y = parseFloat(fo.getAttribute("y") || "0");
    const width = parseFloat(fo.getAttribute("width") || "100");
    const height = parseFloat(fo.getAttribute("height") || "20");

    // Crear elemento <text> SVG nativo
    const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textEl.setAttribute("x", String(x + width / 2));
    textEl.setAttribute("y", String(y + height / 2));
    textEl.setAttribute("text-anchor", "middle");
    textEl.setAttribute("dominant-baseline", "central");
    textEl.setAttribute("font-size", "14");
    textEl.setAttribute("font-family", "sans-serif");

    // Copiar estilo de color del contenido HTML si existe
    const span = fo.querySelector("span, div, p");
    if (span) {
      const style = window.getComputedStyle(span);
      textEl.setAttribute("fill", style.color || "#000");
    } else {
      textEl.setAttribute("fill", "#000");
    }

    // Dividir en líneas si hay múltiples
    const lines = textContent.split("\n").filter((l) => l.trim());
    if (lines.length <= 1) {
      textEl.textContent = textContent;
    } else {
      const lineHeight = 18;
      const startY = y + height / 2 - ((lines.length - 1) * lineHeight) / 2;
      textEl.removeAttribute("y");
      lines.forEach((line, i) => {
        const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        tspan.setAttribute("x", String(x + width / 2));
        tspan.setAttribute("y", String(startY + i * lineHeight));
        tspan.textContent = line.trim();
        textEl.appendChild(tspan);
      });
    }

    // Reemplazar foreignObject con el texto SVG
    fo.parentNode?.replaceChild(textEl, fo);
  });
}

/** Extrae los bloques ```mermaid del markdown, en orden de aparición. */
export function extractMermaidBlocks(markdown: string): string[] {
  const regex = /```mermaid\s*\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    blocks.push(match[1].trim());
  }
  return blocks;
}

/**
 * Renderiza los diagramas mermaid del markdown a SVG bajo demanda, sin depender
 * de ningún componente montado. Sirve para exportar en cualquier modo de vista.
 * Devuelve un SVG por bloque (string vacío si alguno falla).
 */
export async function renderMermaidSvgsFromMarkdown(
  markdown: string,
  theme: Theme
): Promise<string[]> {
  const blocks = extractMermaidBlocks(markdown);
  if (blocks.length === 0) return [];

  initMermaid(theme);
  const results: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    try {
      const { svg } = await mermaid.render(`export-mermaid-${i}`, blocks[i]);
      // Parsear el SVG para aplicar la conversión de foreignObject → <text>.
      const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
      const svgEl = doc.querySelector("svg");
      if (svgEl) {
        svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        convertForeignObjectToText(svgEl as unknown as SVGElement);
        results.push(svgEl.outerHTML);
      } else {
        results.push(svg);
      }
    } catch (e) {
      console.error("Error rendering mermaid for export:", e);
      results.push("");
    }
  }

  return results;
}
