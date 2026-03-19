import { invoke } from "@tauri-apps/api/core";
import type { FileEntry, VaultInfo, ImportResult } from "@/types";

export async function getFileTree(vaultPath: string): Promise<FileEntry[]> {
  return invoke("get_file_tree", { vaultPath });
}

export async function getVaultInfo(vaultPath: string): Promise<VaultInfo> {
  return invoke("get_vault_info", { vaultPath });
}

export async function countVaultNotes(vaultPath: string): Promise<number> {
  return invoke("count_vault_notes", { vaultPath });
}

export async function readFile(
  vaultPath: string,
  filePath: string
): Promise<string> {
  return invoke("read_file", { vaultPath, filePath });
}

export async function writeFile(
  vaultPath: string,
  filePath: string,
  content: string
): Promise<void> {
  return invoke("write_file", { vaultPath, filePath, content });
}

export async function createFile(
  vaultPath: string,
  filePath: string
): Promise<void> {
  return invoke("create_file", { vaultPath, filePath });
}

export async function createFolder(
  vaultPath: string,
  folderPath: string
): Promise<void> {
  return invoke("create_folder", { vaultPath, folderPath });
}

export async function deleteFile(
  vaultPath: string,
  filePath: string
): Promise<void> {
  return invoke("delete_file", { vaultPath, filePath });
}

export async function renameFile(
  vaultPath: string,
  oldPath: string,
  newPath: string
): Promise<void> {
  return invoke("rename_file", { vaultPath, oldPath, newPath });
}

export async function importFile(
  vaultPath: string,
  sourcePath: string
): Promise<string> {
  return invoke("import_file", { vaultPath, sourcePath });
}

export async function importImage(
  vaultPath: string,
  sourcePath: string
): Promise<string> {
  return invoke("import_image", { vaultPath, sourcePath });
}

export async function readImageBase64(
  vaultPath: string,
  filePath: string
): Promise<string> {
  return invoke("read_image_base64", { vaultPath, filePath });
}

export async function exportFile(
  vaultPath: string,
  filePath: string,
  destPath: string
): Promise<void> {
  return invoke("export_file", { vaultPath, filePath, destPath });
}

export async function importFileSmart(
  vaultPath: string,
  sourcePath: string
): Promise<ImportResult> {
  return invoke("import_file_smart", { vaultPath, sourcePath });
}

export async function checkPandocAvailable(): Promise<boolean> {
  return invoke("check_pandoc_available");
}

export async function exportAsTxt(
  vaultPath: string,
  filePath: string,
  destPath: string
): Promise<void> {
  return invoke("export_as_txt", { vaultPath, filePath, destPath });
}

export async function exportAsHtml(
  vaultPath: string,
  filePath: string,
  destPath: string,
  htmlContent: string
): Promise<void> {
  return invoke("export_as_html", { vaultPath, filePath, destPath, htmlContent });
}

export async function exportAsPdf(
  vaultPath: string,
  filePath: string,
  destPath: string
): Promise<void> {
  return invoke("export_as_pdf", { vaultPath, filePath, destPath });
}

export async function exportAsDocx(
  vaultPath: string,
  filePath: string,
  destPath: string
): Promise<void> {
  return invoke("export_as_docx", { vaultPath, filePath, destPath });
}
