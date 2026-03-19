import { useEffect, useRef, useCallback } from "react";
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  indentOnInput,
} from "@codemirror/language";
import { useEditorStore } from "@/stores/editor-store";
import { useUIStore } from "@/stores/ui-store";

const darkTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--color-editor-bg)",
      color: "var(--color-editor-fg)",
      height: "100%",
    },
    ".cm-content": {
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: "14px",
      lineHeight: "1.6",
      padding: "16px 0",
      caretColor: "var(--color-editor-cursor)",
    },
    ".cm-cursor": {
      borderLeftColor: "var(--color-editor-cursor)",
    },
    ".cm-activeLine": {
      backgroundColor: "var(--color-editor-active-line)",
    },
    ".cm-gutters": {
      backgroundColor: "var(--color-editor-gutter-bg)",
      color: "var(--color-editor-gutter-fg)",
      border: "none",
      paddingRight: "8px",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "var(--color-editor-active-line)",
    },
    ".cm-selectionBackground": {
      backgroundColor: "var(--color-editor-selection) !important",
    },
    "&.cm-focused .cm-selectionBackground": {
      backgroundColor: "var(--color-editor-selection) !important",
    },
    ".cm-scroller": {
      overflow: "auto",
    },
  },
  { dark: true }
);

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function MarkdownEditor({ content, onChange }: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const setCursor = useEditorStore((s) => s.setCursor);
  const setEditorView = useEditorStore((s) => s.setEditorView);
  const theme = useUIStore((s) => s.theme);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const createEditor = useCallback(() => {
    if (!containerRef.current) return;

    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString());
      }
      if (update.selectionSet) {
        const pos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(pos);
        setCursor(line.number, pos - line.from + 1);
      }
    });

    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        drawSelection(),
        bracketMatching(),
        indentOnInput(),
        history(),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        syntaxHighlighting(defaultHighlightStyle),
        darkTheme,
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        updateListener,
        EditorView.lineWrapping,
      ],
    });

    viewRef.current = new EditorView({
      state,
      parent: containerRef.current,
    });
    setEditorView(viewRef.current);
  }, []);

  useEffect(() => {
    createEditor();
    return () => {
      viewRef.current?.destroy();
      setEditorView(null);
    };
  }, [createEditor]);

  // Update content when tab changes (external content change)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== content) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: content },
      });
    }
  }, [content]);

  // Re-create editor on theme change to pick up CSS variable changes
  useEffect(() => {
    if (viewRef.current) {
      const currentContent = viewRef.current.state.doc.toString();
      createEditor();
      // The content is already set via the `content` prop in createEditor
    }
  }, [theme, createEditor]);

  return (
    <div ref={containerRef} className="h-full overflow-hidden [&_.cm-editor]:h-full" />
  );
}
