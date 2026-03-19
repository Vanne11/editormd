import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  File,
  FileType,
  Presentation,
} from "lucide-react";

const ICON_MAP: Record<string, typeof File> = {
  // Documents
  md: FileText,
  markdown: FileText,
  txt: FileText,
  pdf: FileType,
  doc: FileText,
  docx: FileText,
  odt: FileText,
  rtf: FileText,
  // Web
  html: FileCode,
  htm: FileCode,
  css: FileCode,
  js: FileCode,
  ts: FileCode,
  json: FileCode,
  xml: FileCode,
  yaml: FileCode,
  yml: FileCode,
  // Images
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  svg: FileImage,
  webp: FileImage,
  bmp: FileImage,
  ico: FileImage,
  // Video
  mp4: FileVideo,
  mkv: FileVideo,
  avi: FileVideo,
  mov: FileVideo,
  webm: FileVideo,
  // Audio
  mp3: FileAudio,
  wav: FileAudio,
  ogg: FileAudio,
  flac: FileAudio,
  // Archives
  zip: FileArchive,
  tar: FileArchive,
  gz: FileArchive,
  "7z": FileArchive,
  rar: FileArchive,
  // Spreadsheet
  csv: FileSpreadsheet,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  // Presentation
  ppt: Presentation,
  pptx: Presentation,
  // Org/RST
  org: FileText,
  rst: FileText,
};

export function getFileIcon(fileType?: string) {
  if (!fileType) return File;
  return ICON_MAP[fileType] ?? File;
}

const EDITABLE_EXTENSIONS = new Set(["md", "markdown", "txt"]);

export function isEditableFile(fileType?: string): boolean {
  if (!fileType) return false;
  return EDITABLE_EXTENSIONS.has(fileType);
}

export async function openWithSystem(fullPath: string): Promise<void> {
  const { open } = await import("@tauri-apps/plugin-shell");
  await open(fullPath);
}
