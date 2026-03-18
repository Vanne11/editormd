import { MarkdownEditor } from "./MarkdownEditor";
import { MarkdownPreview } from "./MarkdownPreview";
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
      <div className="flex-1 flex min-h-0">
        {(viewMode === "editor" || viewMode === "split") && (
          <div className={viewMode === "split" ? "w-1/2 border-r border-border" : "w-full"}>
            <MarkdownEditor
              content={activeTab.content}
              onChange={(content) => updateContent(activeTab.id, content)}
            />
          </div>
        )}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className={viewMode === "split" ? "w-1/2" : "w-full"}>
            <MarkdownPreview content={activeTab.content} />
          </div>
        )}
      </div>
    </div>
  );
}
