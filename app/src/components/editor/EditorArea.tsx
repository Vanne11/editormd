import { useEffect, useRef, useCallback } from "react";
import { MarkdownEditor } from "./MarkdownEditor";
import { MarkdownPreview } from "./MarkdownPreview";
import { MilkdownEditor } from "./milkdown/MilkdownEditor";
import { EditorToolbar } from "./EditorToolbar";
import { EditorTabs } from "./EditorTabs";
import { useEditorStore } from "@/stores/editor-store";
import { useUIStore } from "@/stores/ui-store";
import { useVaultStore } from "@/stores/vault-store";
import { useSettingsStore } from "@/stores/settings-store";
import { FileText } from "lucide-react";

export function EditorArea() {
  const activeTab = useEditorStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const updateContent = useEditorStore((s) => s.updateContent);
  const viewMode = useUIStore((s) => s.viewMode);
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const t = useSettingsStore((s) => s.t);
  const panelsRef = useRef<HTMLDivElement>(null);

  const handleContentChange = useCallback(
    (content: string) => {
      if (activeTab) updateContent(activeTab.id, content);
    },
    [activeTab?.id, updateContent]
  );

  // Scroll sync between editor and preview in split mode
  useEffect(() => {
    if (viewMode !== "split") return;
    const container = panelsRef.current;
    if (!container) return;

    let editorEl: HTMLElement | null = null;
    let previewEl: HTMLElement | null = null;
    let source: "editor" | "preview" | null = null;
    let guardTimer: ReturnType<typeof setTimeout>;
    let disposed = false;

    const sync = (from: HTMLElement, to: HTMLElement) => {
      const max = from.scrollHeight - from.clientHeight;
      if (max <= 0) return;
      const pct = from.scrollTop / max;
      to.scrollTop = pct * (to.scrollHeight - to.clientHeight);
    };

    const onEditorScroll = () => {
      if (source === "preview") return;
      source = "editor";
      clearTimeout(guardTimer);
      sync(editorEl!, previewEl!);
      guardTimer = setTimeout(() => { source = null; }, 80);
    };

    const onPreviewScroll = () => {
      if (source === "editor") return;
      source = "preview";
      clearTimeout(guardTimer);
      sync(previewEl!, editorEl!);
      guardTimer = setTimeout(() => { source = null; }, 80);
    };

    // Wait for both scroll containers to exist in the DOM
    const tryAttach = () => {
      if (disposed) return;
      editorEl = container.querySelector('[data-panel="editor"] .cm-scroller');
      previewEl = container.querySelector('[data-panel="preview"] .preview-scroll');
      if (editorEl && previewEl) {
        editorEl.addEventListener("scroll", onEditorScroll);
        previewEl.addEventListener("scroll", onPreviewScroll);
      } else {
        requestAnimationFrame(tryAttach);
      }
    };
    requestAnimationFrame(tryAttach);

    return () => {
      disposed = true;
      clearTimeout(guardTimer);
      editorEl?.removeEventListener("scroll", onEditorScroll);
      previewEl?.removeEventListener("scroll", onPreviewScroll);
    };
  }, [viewMode, activeTab?.id]);

  if (!vaultPath) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-3">
          <FileText className="size-16 mx-auto opacity-30" />
          <p className="text-lg">{t.editor.openVaultToStart}</p>
          <p className="text-sm">{t.editor.useCtrlO}</p>
        </div>
      </div>
    );
  }

  if (!activeTab) {
    return (
      <div className="flex-1 flex flex-col">
        <EditorTabs />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-3">
            <FileText className="size-16 mx-auto opacity-30" />
            <p className="text-lg">{t.editor.selectNote}</p>
            <p className="text-sm">{t.editor.useCtrlN}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <EditorTabs />
      <EditorToolbar />
      <div className="flex-1 flex min-h-0" ref={panelsRef}>
        {viewMode === "wysiwyg" && (
          <div className="w-full h-full overflow-hidden" data-panel="wysiwyg">
            <MilkdownEditor
              content={activeTab.content}
              onChange={handleContentChange}
            />
          </div>
        )}
        {(viewMode === "code" || viewMode === "split") && (
          <div
            className={viewMode === "split" ? "flex-1 min-w-0 border-r border-border h-full overflow-hidden" : "w-full h-full overflow-hidden"}
            data-panel="editor"
          >
            <MarkdownEditor
              content={activeTab.content}
              onChange={handleContentChange}
            />
          </div>
        )}
        {viewMode === "split" && (
          <div
            className="flex-1 min-w-0 h-full overflow-hidden"
            data-panel="preview"
          >
            {/* Solo lectura: sin onChange (evita el round-trip Turndown roto). */}
            <MarkdownPreview content={activeTab.content} />
          </div>
        )}
      </div>
    </div>
  );
}
