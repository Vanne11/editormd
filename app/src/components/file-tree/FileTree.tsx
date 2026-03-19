import { useState, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  FilePlus,
  FolderPlus,
  Trash2,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FileEntry } from "@/types";
import { useVaultStore } from "@/stores/vault-store";
import { useEditorStore } from "@/stores/editor-store";
import {
  createFile,
  createFolder,
  deleteFile,
  renameFile,
} from "@/lib/tauri";
import { useSettingsStore } from "@/stores/settings-store";
import { getFileIcon, isEditableFile, openWithSystem } from "@/lib/file-utils";

interface FileTreeItemProps {
  entry: FileEntry;
  depth: number;
  onFileClick: (path: string) => void;
}

function FileTreeItem({ entry, depth, onFileClick }: FileTreeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(entry.name);
  const [showActions, setShowActions] = useState(false);
  const [isCreating, setIsCreating] = useState<"file" | "folder" | null>(null);
  const [createValue, setCreateValue] = useState("");
  const isSubmittingRef = useRef(false);
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const refreshFileTree = useVaultStore((s) => s.refreshFileTree);
  const activeTabPath = useEditorStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.path;
  });
  const openFile = useEditorStore((s) => s.openFile);
  const t = useSettingsStore((s) => s.t);

  const isActive = !entry.is_dir && activeTabPath === entry.path;

  const handleClick = async () => {
    if (entry.is_dir) {
      setExpanded(!expanded);
    } else if (isEditableFile(entry.file_type)) {
      onFileClick(entry.path);
    } else if (vaultPath) {
      const fullPath = `${vaultPath}/${entry.path}`;
      try {
        await openWithSystem(fullPath);
      } catch (e) {
        console.error("Error opening file with system:", e);
      }
    }
  };

  const handleRename = async () => {
    if (!vaultPath || renameValue === entry.name || !renameValue.trim()) {
      setIsRenaming(false);
      return;
    }
    const parentPath = entry.path.includes("/")
      ? entry.path.substring(0, entry.path.lastIndexOf("/"))
      : "";
    const newPath = parentPath ? `${parentPath}/${renameValue}` : renameValue;
    try {
      await renameFile(vaultPath, entry.path, newPath);
      await refreshFileTree();
    } catch (e) {
      console.error(e);
    }
    setIsRenaming(false);
  };

  const handleDelete = async () => {
    if (!vaultPath) return;
    try {
      await deleteFile(vaultPath, entry.path);
      await refreshFileTree();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (type: "file" | "folder") => {
    if (isSubmittingRef.current || !vaultPath || !createValue.trim()) {
      setIsCreating(null);
      setCreateValue("");
      return;
    }
    isSubmittingRef.current = true;
    const newPath = entry.is_dir
      ? `${entry.path}/${createValue}${type === "file" ? ".md" : ""}`
      : createValue;
    try {
      if (type === "file") {
        await createFile(vaultPath, newPath);
      } else {
        await createFolder(vaultPath, newPath);
      }
      await refreshFileTree();
      if (entry.is_dir) setExpanded(true);
      if (type === "file") {
        await openFile(vaultPath, newPath);
      }
    } catch (e) {
      console.error(e);
    }
    setIsCreating(null);
    setCreateValue("");
    isSubmittingRef.current = false;
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 py-0.5 px-1 rounded-sm cursor-pointer text-sm group select-none",
          "hover:bg-accent/50",
          isActive && "bg-accent text-accent-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={handleClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {entry.is_dir ? (
          <>
            {expanded ? (
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
            )}
            {expanded ? (
              <FolderOpen className="size-3.5 shrink-0 text-yellow-500" />
            ) : (
              <Folder className="size-3.5 shrink-0 text-yellow-500" />
            )}
          </>
        ) : (
          (() => {
            const Icon = getFileIcon(entry.file_type);
            return (
              <>
                <span className="w-3.5" />
                <Icon className="size-3.5 shrink-0 text-muted-foreground" />
              </>
            );
          })()
        )}

        {isRenaming ? (
          <input
            className="flex-1 bg-input text-foreground text-sm px-1 rounded border border-border outline-none"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") setIsRenaming(false);
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate flex-1">{entry.name}</span>
        )}

        {showActions && !isRenaming && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
            {entry.is_dir && (
              <>
                <button
                  className="p-0.5 rounded hover:bg-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCreating("file");
                    setExpanded(true);
                  }}
                  title={t.sidebar.newNote}
                >
                  <FilePlus className="size-3" />
                </button>
                <button
                  className="p-0.5 rounded hover:bg-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCreating("folder");
                    setExpanded(true);
                  }}
                  title={t.sidebar.newFolder}
                >
                  <FolderPlus className="size-3" />
                </button>
              </>
            )}
            <button
              className="p-0.5 rounded hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation();
                setIsRenaming(true);
                setRenameValue(entry.name);
              }}
              title={t.sidebar.rename}
            >
              <Pencil className="size-3" />
            </button>
            <button
              className="p-0.5 rounded hover:bg-destructive/20 text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              title={t.sidebar.delete}
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        )}
      </div>

      {isCreating && entry.is_dir && (
        <div
          className="flex items-center gap-1 py-0.5 px-1"
          style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
        >
          {isCreating === "file" ? (
            <FileText className="size-3.5 text-muted-foreground" />
          ) : (
            <Folder className="size-3.5 text-yellow-500" />
          )}
          <input
            className="flex-1 bg-input text-foreground text-sm px-1 rounded border border-border outline-none"
            placeholder={
              isCreating === "file" ? t.sidebar.noteName : t.sidebar.folderName
            }
            value={createValue}
            onChange={(e) => setCreateValue(e.target.value)}
            onBlur={() => {
              if (!isSubmittingRef.current) {
                setIsCreating(null);
                setCreateValue("");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate(isCreating);
              if (e.key === "Escape") {
                setIsCreating(null);
                setCreateValue("");
              }
            }}
            autoFocus
          />
        </div>
      )}

      {entry.is_dir && expanded && entry.children && (
        <div>
          {entry.children.map((child) => (
            <FileTreeItem
              key={child.path}
              entry={child}
              depth={depth + 1}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree() {
  const fileTree = useVaultStore((s) => s.fileTree);
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const refreshFileTree = useVaultStore((s) => s.refreshFileTree);
  const openFile = useEditorStore((s) => s.openFile);
  const t = useSettingsStore((s) => s.t);
  const [isCreating, setIsCreating] = useState<"file" | "folder" | null>(null);
  const [createValue, setCreateValue] = useState("");
  const isSubmittingRef = useRef(false);

  const handleFileClick = async (filePath: string) => {
    if (vaultPath) {
      await openFile(vaultPath, filePath);
    }
  };

  const handleRootCreate = async (type: "file" | "folder") => {
    if (isSubmittingRef.current || !vaultPath || !createValue.trim()) {
      setIsCreating(null);
      setCreateValue("");
      return;
    }
    isSubmittingRef.current = true;
    const newPath = type === "file" ? `${createValue}.md` : createValue;
    try {
      if (type === "file") {
        await createFile(vaultPath, newPath);
      } else {
        await createFolder(vaultPath, newPath);
      }
      await refreshFileTree();
      if (type === "file") {
        await openFile(vaultPath, newPath);
      }
    } catch (e) {
      console.error(e);
    }
    setIsCreating(null);
    setCreateValue("");
    isSubmittingRef.current = false;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.sidebar.explorer}
        </span>
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
            onClick={() => setIsCreating("file")}
            title="Nueva nota"
          >
            <FilePlus className="size-3.5" />
          </button>
          <button
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
            onClick={() => setIsCreating("folder")}
            title="Nueva carpeta"
          >
            <FolderPlus className="size-3.5" />
          </button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-1">
          {isCreating && (
            <div className="flex items-center gap-1 py-0.5 px-2">
              {isCreating === "file" ? (
                <FileText className="size-3.5 text-muted-foreground" />
              ) : (
                <Folder className="size-3.5 text-yellow-500" />
              )}
              <input
                className="flex-1 bg-input text-foreground text-sm px-1 rounded border border-border outline-none"
                placeholder={
                  isCreating === "file" ? t.sidebar.noteName : t.sidebar.folderName
                }
                value={createValue}
                onChange={(e) => setCreateValue(e.target.value)}
                onBlur={() => {
                  if (!isSubmittingRef.current) {
                    setIsCreating(null);
                    setCreateValue("");
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRootCreate(isCreating);
                  if (e.key === "Escape") {
                    setIsCreating(null);
                    setCreateValue("");
                  }
                }}
                autoFocus
              />
            </div>
          )}
          {fileTree.map((entry) => (
            <FileTreeItem
              key={entry.path}
              entry={entry}
              depth={0}
              onFileClick={handleFileClick}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
