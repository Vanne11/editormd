import { useState, useEffect } from "react";
import {
  FileText,
  FileType,
  FileCode,
  File,
  X,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { save } from "@tauri-apps/plugin-dialog";
import { useEditorStore } from "@/stores/editor-store";
import { useVaultStore } from "@/stores/vault-store";
import { useSettingsStore } from "@/stores/settings-store";
import {
  checkPandocAvailable,
  exportFile,
  exportAsTxt,
  exportAsHtml,
  exportAsPdf,
  exportAsDocx,
} from "@/lib/tauri";
import { markdownToHtmlDocument } from "@/lib/export-html";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

type ExportFormat = "md" | "txt" | "html" | "pdf" | "docx";

interface FormatOption {
  id: ExportFormat;
  icon: typeof File;
  needsPandoc: boolean;
  ext: string;
}

const FORMATS: FormatOption[] = [
  { id: "md", icon: FileText, needsPandoc: false, ext: "md" },
  { id: "txt", icon: FileText, needsPandoc: false, ext: "txt" },
  { id: "html", icon: FileCode, needsPandoc: false, ext: "html" },
  { id: "pdf", icon: FileType, needsPandoc: true, ext: "pdf" },
  { id: "docx", icon: FileText, needsPandoc: true, ext: "docx" },
];

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("md");
  const [hasPandoc, setHasPandoc] = useState<boolean | null>(null);
  const [status, setStatus] = useState<"idle" | "exporting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const activeTab = useEditorStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const t = useSettingsStore((s) => s.t);

  useEffect(() => {
    if (open) {
      checkPandocAvailable().then(setHasPandoc).catch(() => setHasPandoc(false));
      setStatus("idle");
      setErrorMsg("");
      setSelectedFormat("md");
    }
  }, [open]);

  if (!open || !activeTab) return null;

  const baseName = activeTab.name.replace(/\.[^.]+$/, "");

  const handleExport = async () => {
    if (!vaultPath) return;
    const format = FORMATS.find((f) => f.id === selectedFormat)!;

    const destPath = await save({
      defaultPath: `${baseName}.${format.ext}`,
      filters: [{ name: format.id.toUpperCase(), extensions: [format.ext] }],
    });

    if (!destPath || typeof destPath !== "string") return;

    setStatus("exporting");
    try {
      switch (selectedFormat) {
        case "md":
          await exportFile(vaultPath, activeTab.path, destPath);
          break;
        case "txt":
          await exportAsTxt(vaultPath, activeTab.path, destPath);
          break;
        case "html": {
          const htmlDoc = markdownToHtmlDocument(activeTab.content, baseName);
          await exportAsHtml(vaultPath, activeTab.path, destPath, htmlDoc);
          break;
        }
        case "pdf":
          await exportAsPdf(vaultPath, activeTab.path, destPath);
          break;
        case "docx":
          await exportAsDocx(vaultPath, activeTab.path, destPath);
          break;
      }
      setStatus("success");
      setTimeout(() => onClose(), 1200);
    } catch (e) {
      setStatus("error");
      setErrorMsg(String(e));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background border border-border rounded-lg shadow-lg w-full max-w-sm p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">{t.export.title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-1 mb-4">
          {FORMATS.map((format) => {
            const disabled = format.needsPandoc && !hasPandoc;
            const Icon = format.icon;
            return (
              <button
                key={format.id}
                disabled={disabled}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors ${
                  selectedFormat === format.id
                    ? "bg-accent text-accent-foreground"
                    : disabled
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-accent/50 cursor-pointer"
                }`}
                onClick={() => !disabled && setSelectedFormat(format.id)}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">{t.export[format.id === "txt" ? "plainText" : format.id === "docx" ? "docx" : format.id]}</span>
                {format.needsPandoc && (
                  <span className="text-xs text-muted-foreground">
                    {hasPandoc === false ? t.export.requiresPandoc : "pandoc"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {status === "error" && (
          <div className="flex items-center gap-2 text-destructive text-xs mb-3 p-2 bg-destructive/10 rounded">
            <AlertCircle className="size-3.5 shrink-0" />
            <span>{errorMsg || t.export.error}</span>
          </div>
        )}

        {status === "success" && (
          <div className="flex items-center gap-2 text-green-600 text-xs mb-3 p-2 bg-green-500/10 rounded">
            <Check className="size-3.5 shrink-0" />
            <span>{t.export.success}</span>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t.export.cancel}
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={status === "exporting" || status === "success"}
          >
            {status === "exporting" && <Loader2 className="size-3.5 mr-1 animate-spin" />}
            {t.export.exportBtn}
          </Button>
        </div>
      </div>
    </div>
  );
}
