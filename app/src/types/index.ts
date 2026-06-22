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

export interface SearchMatch {
  line: number;
  text: string;
}

export interface SearchResult {
  path: string;
  name: string;
  name_match: boolean;
  matches: SearchMatch[];
}

export interface Tab {
  id: string;
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
}

export type ViewMode = "wysiwyg" | "code" | "split";

export type Theme = "dark" | "light" | "sepia" | "pastel" | "dracula" | "alucard";
