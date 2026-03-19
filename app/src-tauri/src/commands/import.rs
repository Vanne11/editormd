use crate::models::ImportResult;
use std::fs;
use std::path::{Path, PathBuf};

fn copy_with_dedup(source: &Path, dest_dir: &Path, file_name: &str) -> Result<PathBuf, String> {
    let dest = dest_dir.join(file_name);
    let final_dest = if dest.exists() {
        let source_path = Path::new(file_name);
        let stem = source_path
            .file_stem()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        let ext = source_path
            .extension()
            .map(|e| format!(".{}", e.to_string_lossy()))
            .unwrap_or_default();
        let mut counter = 1u32;
        loop {
            let new_name = format!("{}-{}{}", stem, counter, ext);
            let candidate = dest_dir.join(&new_name);
            if !candidate.exists() {
                break candidate;
            }
            counter += 1;
        }
    } else {
        dest
    };
    fs::copy(source, &final_dest).map_err(|e| format!("Error al copiar: {}", e))?;
    Ok(final_dest)
}

fn save_as_md(vault: &Path, vault_path: &str, stem: &str, content: &str) -> Result<String, String> {
    let md_name = format!("{}.md", stem);
    let dest = vault.join(&md_name);
    let final_dest = if dest.exists() {
        let mut counter = 1u32;
        loop {
            let new_name = format!("{}-{}.md", stem, counter);
            let candidate = vault.join(&new_name);
            if !candidate.exists() {
                break candidate;
            }
            counter += 1;
        }
    } else {
        dest
    };
    fs::write(&final_dest, content)
        .map_err(|e| format!("Error al escribir MD: {}", e))?;
    let relative = final_dest
        .strip_prefix(vault_path)
        .unwrap_or(&final_dest)
        .to_string_lossy()
        .to_string();
    Ok(relative)
}

#[tauri::command]
pub fn import_file_smart(vault_path: String, source_path: String) -> Result<ImportResult, String> {
    let source = Path::new(&source_path);
    if !source.exists() {
        return Err("El archivo origen no existe".to_string());
    }

    let file_name = source
        .file_name()
        .ok_or("No se pudo obtener el nombre del archivo")?
        .to_string_lossy()
        .to_string();

    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    let vault = Path::new(&vault_path);

    match ext.as_str() {
        // Text files — copia directa
        "md" | "markdown" | "txt" => {
            let final_dest = copy_with_dedup(source, vault, &file_name)?;
            let relative = final_dest
                .strip_prefix(&vault_path)
                .unwrap_or(&final_dest)
                .to_string_lossy()
                .to_string();
            Ok(ImportResult {
                relative_path: relative,
                was_converted: false,
                original_format: ext,
            })
        }
        // HTML — conversión nativa con html2md
        "html" | "htm" => {
            let html_content = fs::read_to_string(source)
                .map_err(|e| format!("Error al leer HTML: {}", e))?;
            let md_content = super::convert::html_to_markdown(&html_content);
            let stem = source
                .file_stem()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();
            let relative = save_as_md(vault, &vault_path, &stem, &md_content)?;
            Ok(ImportResult {
                relative_path: relative,
                was_converted: true,
                original_format: ext,
            })
        }
        // Formatos que requieren pandoc (DOCX, ORG, RST)
        "docx" | "org" | "rst" => {
            let pandoc_format = match ext.as_str() {
                "docx" => "docx",
                "org" => "org",
                "rst" => "rst",
                _ => unreachable!(),
            };
            let pandoc_result = std::process::Command::new("pandoc")
                .args(["-f", pandoc_format, "-t", "markdown", "--wrap=none", &source_path])
                .output();

            match pandoc_result {
                Ok(output) if output.status.success() => {
                    let md_content = String::from_utf8_lossy(&output.stdout).to_string();
                    let stem = source
                        .file_stem()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_string();
                    let relative = save_as_md(vault, &vault_path, &stem, &md_content)?;
                    Ok(ImportResult {
                        relative_path: relative,
                        was_converted: true,
                        original_format: ext,
                    })
                }
                _ => {
                    Err(format!(
                        "Se requiere pandoc para importar archivos .{}. Instálalo con tu gestor de paquetes.",
                        ext
                    ))
                }
            }
        }
        // Binarios → attachments/
        _ => {
            let attachments_dir = vault.join("attachments");
            fs::create_dir_all(&attachments_dir)
                .map_err(|e| format!("Error al crear carpeta attachments: {}", e))?;
            let final_dest = copy_with_dedup(source, &attachments_dir, &file_name)?;
            let relative = final_dest
                .strip_prefix(&vault_path)
                .unwrap_or(&final_dest)
                .to_string_lossy()
                .to_string();
            Ok(ImportResult {
                relative_path: relative,
                was_converted: false,
                original_format: ext,
            })
        }
    }
}
