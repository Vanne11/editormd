import { readImageBase64 } from "@/lib/tauri";

/** Una ruta es resoluble contra el vault si no es http(s) ni data URI. */
export function isResolvableImageSrc(src: string | null | undefined): src is string {
  return !!src && !src.startsWith("http") && !src.startsWith("data:");
}

/** Resuelve una ruta relativa del vault a un data URI; null si falla. */
export async function resolveVaultImage(
  vaultPath: string,
  src: string
): Promise<string | null> {
  try {
    return await readImageBase64(vaultPath, src);
  } catch {
    return null;
  }
}
