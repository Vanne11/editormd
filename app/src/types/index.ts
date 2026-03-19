export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileEntry[];
  file_type?: string;
}

export interface ImportResult {
  relative_path: string;
  was_converted: boolean;
  original_format: string;
}

export interface VaultInfo {
  path: string;
  name: string;
}

export interface Tab {
  id: string;
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
}

export type ViewMode = "editor" | "preview" | "split";

export type Theme = "dark" | "light" | "sepia" | "pastel" | "dracula" | "alucard";
