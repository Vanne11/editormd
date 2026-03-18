import { invoke } from "@tauri-apps/api/core";
import type { FileEntry, VaultInfo } from "@/types";

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
