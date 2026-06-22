import type { EditorView } from "@codemirror/view";
import { executeMarkdownAction, insertImageReference } from "@/lib/markdown-commands";
import type { EditorSurface } from "./types";

/** Superficie de edición respaldada por CodeMirror (modo Código/split). */
export function createCodeMirrorSurface(view: EditorView): EditorSurface {
  return {
    runAction: (key) => executeMarkdownAction(view, key),
    insertImage: (relativePath) => insertImageReference(view, relativePath),
    focus: () => view.focus(),
  };
}
