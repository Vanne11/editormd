export type ToolbarKey =
  | "bold"
  | "italic"
  | "strikethrough"
  | "heading1"
  | "heading2"
  | "heading3"
  | "list"
  | "orderedList"
  | "checklist"
  | "code"
  | "quote"
  | "link"
  | "table"
  | "separator";

/**
 * Abstracción sobre la superficie de edición activa (CodeMirror o Milkdown).
 * Permite que la toolbar aplique formato sin conocer el editor subyacente.
 */
export interface EditorSurface {
  runAction: (key: ToolbarKey) => void;
  insertImage: (relativePath: string) => void;
  focus: () => void;
}
