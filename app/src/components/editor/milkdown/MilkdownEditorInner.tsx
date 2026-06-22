import { useEffect, useRef } from "react";
import {
  Editor,
  rootCtx,
  defaultValueCtx,
  editorViewOptionsCtx,
  editorViewCtx,
} from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { gfm } from "@milkdown/preset-gfm";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { math } from "@milkdown/plugin-math";
import { replaceAll } from "@milkdown/utils";
import { Milkdown, useEditor, useInstance } from "@milkdown/react";
import "katex/dist/katex.min.css";
import { useEditorStore } from "@/stores/editor-store";
import { useUIStore } from "@/stores/ui-store";
import { createMilkdownSurface } from "@/lib/editor-surface/milkdown-surface";
import { vaultImagePlugin } from "./plugins/vault-image";
import { prism, configurePrism } from "./plugins/code-highlight";
import { mermaidPreviewPlugin, MERMAID_REFRESH_META } from "./plugins/mermaid-preview";
import { wikilinkDecorationPlugin } from "./plugins/wikilink-decoration";

interface MilkdownEditorInnerProps {
  content: string;
  onChange: (content: string) => void;
}

export function MilkdownEditorInner({ content, onChange }: MilkdownEditorInnerProps) {
  // Refs estables para no recrear el editor en cada render.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Último markdown que el editor emitió/cargó. Sirve para no relanzar
  // replaceAll cuando el cambio de `content` proviene de nuestro propio onChange.
  const lastEmittedRef = useRef(content);
  // Evita que el replaceAll (carga externa) se devuelva al store como edición.
  const suppressRef = useRef(false);
  // El contenido inicial se fija al crear el editor (una sola vez).
  const initialContentRef = useRef(content);

  useEditor((root) =>
    Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, initialContentRef.current);
        ctx.update(editorViewOptionsCtx, (prev) => ({
          ...prev,
          attributes: { class: "milkdown-editor preview-content", spellcheck: "false" },
        }));
        ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
          lastEmittedRef.current = markdown;
          if (suppressRef.current) {
            suppressRef.current = false;
            return;
          }
          onChangeRef.current(markdown);
        });
        configurePrism(ctx);
      })
      .use(commonmark)
      .use(gfm)
      .use(listener)
      .use(math)
      .use(prism)
      .use(vaultImagePlugin)
      .use(mermaidPreviewPlugin)
      .use(wikilinkDecorationPlugin)
  );

  const [loading, getInstance] = useInstance();
  const setActiveSurface = useEditorStore((s) => s.setActiveSurface);
  const theme = useUIStore((s) => s.theme);

  // Reemplaza el documento cuando `content` cambia por una causa externa
  // (cambio de pestaña o guardado externo), nunca por la edición local.
  useEffect(() => {
    if (loading) return;
    if (content === lastEmittedRef.current) return;
    const editor = getInstance();
    if (!editor) return;
    suppressRef.current = true;
    editor.action(replaceAll(content));
    lastEmittedRef.current = content;
  }, [content, loading]);

  // Registra la superficie de edición para que la toolbar aplique formato.
  useEffect(() => {
    if (loading) return;
    const editor = getInstance();
    if (!editor) return;
    setActiveSurface(createMilkdownSurface(editor));
    return () => setActiveSurface(null);
  }, [loading, setActiveSurface]);

  // Al cambiar de tema, re-renderiza los diagramas mermaid del editor.
  useEffect(() => {
    if (loading) return;
    const editor = getInstance();
    if (!editor) return;
    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      view.dispatch(view.state.tr.setMeta(MERMAID_REFRESH_META, true));
    });
  }, [theme, loading]);

  return (
    <div className="h-full overflow-auto">
      <Milkdown />
    </div>
  );
}
