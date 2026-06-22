import { $prose } from "@milkdown/utils";
import { Plugin, PluginKey } from "@milkdown/prose/state";
import { Decoration, DecorationSet } from "@milkdown/prose/view";
import type { Node as ProseNode } from "@milkdown/prose/model";
import mermaid from "mermaid";
import { initMermaid } from "@/lib/mermaid-theme";
import { useUIStore } from "@/stores/ui-store";
import type { Theme } from "@/types";

export const MERMAID_REFRESH_META = "mermaid-refresh";

// Caché de SVG renderizado por (tema + código) para evitar re-render en cada tecla.
const svgCache = new Map<string, string>();
let renderCounter = 0;

function buildWidget(code: string, theme: Theme): HTMLElement {
  const el = document.createElement("div");
  el.className = "mermaid-preview my-3 flex justify-center";
  el.setAttribute("data-mermaid", code);
  el.contentEditable = "false";

  const cacheKey = `${theme}\n${code}`;
  const cached = svgCache.get(cacheKey);
  if (cached) {
    el.innerHTML = cached;
    return el;
  }

  el.innerHTML = '<span class="mermaid-loading">…</span>';
  initMermaid(theme);
  mermaid
    .render(`wysiwyg-mermaid-${renderCounter++}`, code)
    .then(({ svg }) => {
      svgCache.set(cacheKey, svg);
      el.innerHTML = svg;
    })
    .catch((e) => {
      el.innerHTML = "";
      el.textContent = `⚠ ${e?.message ?? e}`;
    });
  return el;
}

function buildDecorations(doc: ProseNode): DecorationSet {
  const theme = useUIStore.getState().theme;
  const decorations: Decoration[] = [];
  let index = 0;

  doc.descendants((node, pos) => {
    if (
      node.type.name === "code_block" &&
      String(node.attrs.language ?? "").toLowerCase() === "mermaid"
    ) {
      const code = node.textContent.trim();
      if (!code) return;
      const after = pos + node.nodeSize;
      const key = `${theme}::${code}::${index++}`;
      decorations.push(
        Decoration.widget(after, () => buildWidget(code, theme), { key, side: 1 })
      );
    }
  });

  return DecorationSet.create(doc, decorations);
}

/**
 * Renderiza un diagrama mermaid debajo de cada bloque ```mermaid en el editor
 * WYSIWYG mediante decoraciones widget (no toca el bloque de código editable).
 */
export const mermaidPreviewPlugin = $prose(
  () =>
    new Plugin<DecorationSet>({
      key: new PluginKey("mermaid-preview"),
      state: {
        init: (_, state) => buildDecorations(state.doc),
        apply: (tr, old) => {
          if (tr.docChanged || tr.getMeta(MERMAID_REFRESH_META)) {
            return buildDecorations(tr.doc);
          }
          return old;
        },
      },
      props: {
        decorations(state) {
          return this.getState(state);
        },
      },
    })
);
