import { $prose } from "@milkdown/utils";
import { Plugin, PluginKey } from "@milkdown/prose/state";
import { Decoration, DecorationSet } from "@milkdown/prose/view";
import type { Node as ProseNode } from "@milkdown/prose/model";
import { resolveWikilink } from "@/lib/wikilink";
import { navigateWikilink } from "@/lib/wikilink-navigate";
import { useVaultStore } from "@/stores/vault-store";

const WIKILINK_GLOBAL = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

function buildDecorations(doc: ProseNode): DecorationSet {
  const fileTree = useVaultStore.getState().fileTree;
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    for (const match of node.text.matchAll(WIKILINK_GLOBAL)) {
      const target = match[1].trim();
      const from = pos + (match.index ?? 0);
      const to = from + match[0].length;
      const missing = resolveWikilink(target, fileTree) ? "false" : "true";
      decorations.push(
        Decoration.inline(from, to, {
          class: "wikilink",
          "data-wikilink": encodeURIComponent(target),
          "data-missing": missing,
        })
      );
    }
  });

  return DecorationSet.create(doc, decorations);
}

/**
 * Resalta `[[nota]]` / `[[nota|alias]]` como enlaces internos en el WYSIWYG y
 * permite navegar con Ctrl/Cmd+click. El texto del documento permanece literal,
 * así que el markdown se conserva sin pérdida (no toca el schema ni el serializer).
 */
export const wikilinkDecorationPlugin = $prose(
  () =>
    new Plugin<DecorationSet>({
      key: new PluginKey("wikilink-decoration"),
      state: {
        init: (_, state) => buildDecorations(state.doc),
        apply: (tr, old) =>
          tr.docChanged ? buildDecorations(tr.doc) : old,
      },
      props: {
        decorations(state) {
          return this.getState(state);
        },
        handleDOMEvents: {
          click: (_view, event) => {
            if (!(event.ctrlKey || event.metaKey)) return false;
            const el = (event.target as HTMLElement | null)?.closest(
              "[data-wikilink]"
            );
            if (!el) return false;
            const target = decodeURIComponent(el.getAttribute("data-wikilink") || "");
            if (!target) return false;
            event.preventDefault();
            navigateWikilink(target);
            return true;
          },
        },
      },
    })
);
