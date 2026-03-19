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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUIStore } from "@/stores/ui-store";
import { useEditorStore } from "@/stores/editor-store";
import { useSettingsStore } from "@/stores/settings-store";
import { executeMarkdownAction } from "@/lib/markdown-commands";
import type { ViewMode } from "@/types";

type ToolbarKey =
  | "bold" | "italic" | "strikethrough"
  | "heading1" | "heading2" | "heading3"
  | "list" | "orderedList" | "checklist"
  | "code" | "quote" | "link" | "image" | "table" | "separator";

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
  { icon: Image, key: "image" },
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
  const t = useSettingsStore((s) => s.t);

  const handleAction = (key: string) => {
    if (editorView) {
      executeMarkdownAction(editorView, key);
    }
  };

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
