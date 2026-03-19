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

/**
 * Extrae los SVGs de mermaid ya renderizados en el preview DOM.
 * Convierte foreignObject a texto SVG nativo para compatibilidad con resvg.
 * Retorna un array de strings SVG en orden de aparición.
 */
export function getMermaidSvgsFromPreview(): string[] {
  const wrappers = document.querySelectorAll("[data-mermaid]");
  const results: string[] = [];

  wrappers.forEach((wrapper) => {
    const svg = wrapper.querySelector("svg");
    if (svg) {
      // Clonar para no mutar el DOM visible
      const clone = svg.cloneNode(true) as SVGElement;
      // Asegurar que tenga xmlns para que resvg lo parsee
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      // Convertir foreignObject → <text> SVG nativo
      convertForeignObjectToText(clone);
      results.push(clone.outerHTML);
    } else {
      results.push("");
    }
  });

  return results;
}
