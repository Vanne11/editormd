import type { EditorView } from "@codemirror/view";

type WrapAction = {
  type: "wrap";
  before: string;
  after: string;
  placeholder: string;
};

type LineAction = {
  type: "line";
  prefix: string;
};

type InsertAction = {
  type: "insert";
  text: string;
};

type MarkdownAction = WrapAction | LineAction | InsertAction;

const actions: Record<string, MarkdownAction> = {
  bold: { type: "wrap", before: "**", after: "**", placeholder: "texto" },
  italic: { type: "wrap", before: "*", after: "*", placeholder: "texto" },
  strikethrough: { type: "wrap", before: "~~", after: "~~", placeholder: "texto" },
  heading1: { type: "line", prefix: "# " },
  heading2: { type: "line", prefix: "## " },
  heading3: { type: "line", prefix: "### " },
  list: { type: "line", prefix: "- " },
  orderedList: { type: "line", prefix: "1. " },
  checklist: { type: "line", prefix: "- [ ] " },
  code: { type: "wrap", before: "`", after: "`", placeholder: "código" },
  quote: { type: "line", prefix: "> " },
  link: { type: "wrap", before: "[", after: "](url)", placeholder: "texto" },
  table: {
    type: "insert",
    text: "| Columna 1 | Columna 2 | Columna 3 |\n| --- | --- | --- |\n| celda | celda | celda |",
  },
  separator: { type: "insert", text: "\n---\n" },
};

export function insertImageReference(view: EditorView, relativePath: string) {
  const { from, to } = view.state.selection.main;
  const fileName = relativePath.split("/").pop() ?? relativePath;
  const text = `![${fileName}](${relativePath})`;
  view.focus();
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  });
}

export function executeMarkdownAction(view: EditorView, key: string) {
  const action = actions[key];
  if (!action) return;

  const { state } = view;
  const { from, to } = state.selection.main;
  const selected = state.sliceDoc(from, to);

  view.focus();

  if (action.type === "wrap") {
    if (selected) {
      // Wrap selection
      const wrapped = action.before + selected + action.after;
      view.dispatch({
        changes: { from, to, insert: wrapped },
        selection: { anchor: from + action.before.length, head: from + action.before.length + selected.length },
      });
    } else {
      // Insert with placeholder, select the placeholder
      const text = action.before + action.placeholder + action.after;
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + action.before.length, head: from + action.before.length + action.placeholder.length },
      });
    }
  } else if (action.type === "line") {
    const line = state.doc.lineAt(from);
    const currentText = line.text;
    // Toggle: if prefix already present, remove it
    if (currentText.startsWith(action.prefix)) {
      const cursorOffset = from - line.from;
      const newCursor = line.from + Math.max(0, cursorOffset - action.prefix.length);
      view.dispatch({
        changes: { from: line.from, to: line.from + action.prefix.length, insert: "" },
        selection: { anchor: newCursor },
      });
    } else {
      // Remove other heading/list prefixes before adding new one
      const headingMatch = currentText.match(/^(#{1,6}\s|[-*]\s\[[ x]\]\s|[-*]\s|\d+\.\s|>\s)/);
      const removeLen = headingMatch ? headingMatch[0].length : 0;
      const newLineEnd = line.from + action.prefix.length + (currentText.length - removeLen);
      view.dispatch({
        changes: { from: line.from, to: line.from + removeLen, insert: action.prefix },
        selection: { anchor: newLineEnd },
      });
    }
  } else if (action.type === "insert") {
    // Insert on a new line if cursor is not at the start of a line
    const line = state.doc.lineAt(from);
    const needsNewline = from !== line.from && line.text.length > 0;
    const text = needsNewline ? "\n" + action.text : action.text;
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
    });
  }
}
