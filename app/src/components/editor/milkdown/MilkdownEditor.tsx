import { MilkdownProvider } from "@milkdown/react";
import { MilkdownEditorInner } from "./MilkdownEditorInner";

interface MilkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
}

/**
 * Editor WYSIWYG basado en Milkdown. Drop-in con el mismo contrato
 * `content` / `onChange` que MarkdownEditor (CodeMirror). El provider debe
 * envolver al componente que llama a useEditor/useInstance.
 */
export function MilkdownEditor(props: MilkdownEditorProps) {
  return (
    <MilkdownProvider>
      <MilkdownEditorInner {...props} />
    </MilkdownProvider>
  );
}
