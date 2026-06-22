import { useEffect, useRef, useCallback } from "react";
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { search, searchKeymap, highlightSelectionMatches } from "@codemirror/search";
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
import { useSettingsStore } from "@/stores/settings-store";
import { createCodeMirrorSurface } from "@/lib/editor-surface/codemirror-surface";
import { imagePreviewField } from "./codemirror-images";
import type { Theme } from "@/types";
import type { Locale } from "@/lib/i18n";

const darkThemes: Theme[] = ["dark", "dracula"];

// Traducciones del panel de búsqueda/reemplazo de CodeMirror.
const searchPhrases: Record<Locale, Record<string, string>> = {
  es: {
    "Find": "Buscar",
    "Replace": "Reemplazar",
    "next": "siguiente",
    "previous": "anterior",
    "all": "todo",
    "match case": "may/min",
    "by word": "palabra completa",
    "regexp": "regex",
    "replace": "reemplazar",
    "replace all": "reemplazar todo",
    "close": "cerrar",
    "Go to line": "Ir a línea",
    "go": "ir",
  },
  en: {},
};

const editorThemeStyles = {
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
  ".cm-panels": {
    backgroundColor: "var(--color-editor-gutter-bg)",
    color: "var(--color-editor-fg)",
    borderBottom: "1px solid var(--color-border, rgba(128,128,128,0.3))",
  },
  ".cm-panel.cm-search": {
    padding: "6px 8px",
  },
  ".cm-panel.cm-search input, .cm-panel.cm-search button, .cm-panel.cm-search label": {
    fontFamily: "inherit",
    fontSize: "12px",
  },
  ".cm-panel.cm-search input": {
    backgroundColor: "var(--color-editor-bg)",
    color: "var(--color-editor-fg)",
    border: "1px solid var(--color-border, rgba(128,128,128,0.3))",
    borderRadius: "4px",
    padding: "2px 6px",
  },
  ".cm-panel.cm-search button": {
    backgroundColor: "transparent",
    color: "var(--color-editor-fg)",
    border: "1px solid var(--color-border, rgba(128,128,128,0.3))",
    borderRadius: "4px",
    cursor: "pointer",
  },
  ".cm-searchMatch": {
    backgroundColor: "var(--color-editor-selection)",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "var(--color-editor-cursor)",
    color: "var(--color-editor-bg)",
  },
};

function createEditorTheme(theme: Theme) {
  return EditorView.theme(editorThemeStyles, { dark: darkThemes.includes(theme) });
}

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function MarkdownEditor({ content, onChange }: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const setCursor = useEditorStore((s) => s.setCursor);
  const setEditorView = useEditorStore((s) => s.setEditorView);
  const setActiveSurface = useEditorStore((s) => s.setActiveSurface);
  const requestedLine = useEditorStore((s) => s.requestedLine);
  const setRequestedLine = useEditorStore((s) => s.setRequestedLine);
  const theme = useUIStore((s) => s.theme);
  const locale = useSettingsStore((s) => s.locale);

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
        highlightSelectionMatches(),
        search({ top: true }),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        syntaxHighlighting(defaultHighlightStyle),
        createEditorTheme(theme),
        EditorState.phrases.of(searchPhrases[locale]),
        keymap.of([...searchKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        updateListener,
        EditorView.lineWrapping,
        imagePreviewField,
      ],
    });

    viewRef.current = new EditorView({
      state,
      parent: containerRef.current,
    });
    setEditorView(viewRef.current);
    setActiveSurface(createCodeMirrorSurface(viewRef.current));
  }, [theme, locale]);

  useEffect(() => {
    createEditor();
    return () => {
      viewRef.current?.destroy();
      setEditorView(null);
      setActiveSurface(null);
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

  // Jump to a requested line (e.g. from global search) once the view is ready
  useEffect(() => {
    if (requestedLine == null) return;
    const view = viewRef.current;
    if (!view) return;
    const id = requestAnimationFrame(() => {
      const v = viewRef.current;
      if (!v) return;
      const lineNo = Math.min(Math.max(1, requestedLine), v.state.doc.lines);
      const line = v.state.doc.line(lineNo);
      v.dispatch({
        selection: { anchor: line.from },
        effects: EditorView.scrollIntoView(line.from, { y: "center" }),
      });
      v.focus();
      setRequestedLine(null);
    });
    return () => cancelAnimationFrame(id);
  }, [requestedLine, setRequestedLine]);

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
