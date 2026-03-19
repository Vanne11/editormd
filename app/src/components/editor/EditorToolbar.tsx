import { useState } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Link,
  Image,
  Table,
  Minus,
  Eye,
  SplitSquareHorizontal,
  FileEdit,
  Import,
  FileOutput,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { open, save } from "@tauri-apps/plugin-dialog";
import { useUIStore } from "@/stores/ui-store";
import { useEditorStore } from "@/stores/editor-store";
import { useVaultStore } from "@/stores/vault-store";
import { useSettingsStore } from "@/stores/settings-store";
import { executeMarkdownAction, insertImageReference } from "@/lib/markdown-commands";
import { importFile, importImage, exportFile } from "@/lib/tauri";
import type { ViewMode } from "@/types";

type ToolbarKey =
  | "bold" | "italic" | "strikethrough"
  | "heading1" | "heading2" | "heading3"
  | "list" | "orderedList" | "checklist"
  | "code" | "quote" | "link" | "table" | "separator";

interface ToolbarAction {
  icon: React.ComponentType<{ className?: string }>;
  key: ToolbarKey;
}

const markdownActions: ToolbarAction[] = [
  { icon: Bold, key: "bold" },
  { icon: Italic, key: "italic" },
  { icon: Strikethrough, key: "strikethrough" },
  { icon: Heading1, key: "heading1" },
  { icon: Heading2, key: "heading2" },
  { icon: Heading3, key: "heading3" },
  { icon: List, key: "list" },
  { icon: ListOrdered, key: "orderedList" },
  { icon: CheckSquare, key: "checklist" },
  { icon: Code, key: "code" },
  { icon: Quote, key: "quote" },
  { icon: Link, key: "link" },
  { icon: Table, key: "table" },
  { icon: Minus, key: "separator" },
];

type ViewModeKey = "editorOnly" | "splitView" | "previewOnly";

const viewModes: { mode: ViewMode; icon: React.ComponentType<{ className?: string }>; key: ViewModeKey }[] = [
  { mode: "editor", icon: FileEdit, key: "editorOnly" },
  { mode: "split", icon: SplitSquareHorizontal, key: "splitView" },
  { mode: "preview", icon: Eye, key: "previewOnly" },
];

export function EditorToolbar() {
  const viewMode = useUIStore((s) => s.viewMode);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const editorView = useEditorStore((s) => s.editorView);
  const activeTab = useEditorStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const openFile = useEditorStore((s) => s.openFile);
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const refreshFileTree = useVaultStore((s) => s.refreshFileTree);
  const t = useSettingsStore((s) => s.t);
  const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle");

  const handleAction = (key: string) => {
    if (editorView) {
      executeMarkdownAction(editorView, key);
    }
  };

  const handleImage = async () => {
    if (!vaultPath || !editorView) return;
    const selected = await open({
      multiple: false,
      filters: [
        { name: "Imágenes", extensions: ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"] },
      ],
    });
    if (!selected || typeof selected !== "string") return;
    try {
      const relativePath = await importImage(vaultPath, selected);
      await refreshFileTree();
      insertImageReference(editorView, relativePath);
    } catch (e) {
      console.error("Error importing image:", e);
    }
  };

  const handleImport = async () => {
    if (!vaultPath) return;
    const selected = await open({
      multiple: true,
      filters: [
        { name: "Markdown", extensions: ["md", "markdown", "txt"] },
      ],
    });
    if (!selected) return;
    const files = Array.isArray(selected) ? selected : [selected];
    for (const filePath of files) {
      if (typeof filePath === "string") {
        try {
          const relativePath = await importFile(vaultPath, filePath);
          await refreshFileTree();
          await openFile(vaultPath, relativePath);
        } catch (e) {
          console.error("Error importing:", e);
        }
      }
    }
  };

  const handleExport = async () => {
    if (!vaultPath || !activeTab) return;
    const destPath = await save({
      defaultPath: activeTab.name,
      filters: [
        { name: "Markdown", extensions: ["md"] },
        { name: "Todos los archivos", extensions: ["*"] },
      ],
    });
    if (destPath && typeof destPath === "string") {
      try {
        await exportFile(vaultPath, activeTab.path, destPath);
        setExportStatus("success");
      } catch (e) {
        console.error("Error exporting:", e);
        setExportStatus("error");
      }
      setTimeout(() => setExportStatus("idle"), 2000);
    }
  };

  const ExportIcon =
    exportStatus === "success" ? Check :
    exportStatus === "error" ? AlertCircle :
    FileOutput;

  const exportIconClass =
    exportStatus === "success" ? "size-3.5 text-green-500" :
    exportStatus === "error" ? "size-3.5 text-destructive" :
    "size-3.5";

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border bg-background/80 overflow-x-auto">
      {markdownActions.map((action) => (
        <Tooltip key={action.key}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleAction(action.key)}>
              <action.icon className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t.editor[action.key]}</TooltipContent>
        </Tooltip>
      ))}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleImage}>
            <Image className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t.editor.image}</TooltipContent>
      </Tooltip>

      <div className="w-px h-5 bg-border mx-1 shrink-0" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleImport}>
            <Import className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t.sidebar.importFile}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleExport} disabled={!activeTab}>
            <ExportIcon className={exportIconClass} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t.sidebar.exportFile}</TooltipContent>
      </Tooltip>

      <div className="w-px h-5 bg-border mx-1 shrink-0" />

      {viewModes.map(({ mode, icon: Icon, key }) => (
        <Tooltip key={mode}>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === mode ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => setViewMode(mode)}
            >
              <Icon className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t.editor[key]}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
