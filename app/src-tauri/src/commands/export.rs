use std::fs;
use std::path::Path;
use std::process::Command;

#[tauri::command]
pub fn export_as_txt(vault_path: String, file_path: String, dest_path: String) -> Result<(), String> {
    let source = Path::new(&vault_path).join(&file_path);
    if !source.exists() {
        return Err("El archivo no existe".to_string());
    }
    let content = fs::read_to_string(&source)
        .map_err(|e| format!("Error al leer archivo: {}", e))?;
    if let Some(parent) = Path::new(&dest_path).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Error al crear directorio: {}", e))?;
    }
    fs::write(&dest_path, content).map_err(|e| format!("Error al exportar TXT: {}", e))
}

#[tauri::command]
pub fn export_as_html(
    vault_path: String,
    file_path: String,
    dest_path: String,
    html_content: String,
) -> Result<(), String> {
    // If html_content is provided (from frontend marked), use it directly
    // Otherwise try pandoc
    let content = if !html_content.is_empty() {
        html_content
    } else {
        let source = Path::new(&vault_path).join(&file_path);
        if !source.exists() {
            return Err("El archivo no existe".to_string());
        }
        let output = Command::new("pandoc")
            .args([
                "-f", "markdown",
                "-t", "html",
                "--standalone",
                source.to_str().unwrap_or_default(),
            ])
            .output()
            .map_err(|e| format!("Error al ejecutar pandoc: {}", e))?;
        if !output.status.success() {
            return Err(format!("Pandoc error: {}", String::from_utf8_lossy(&output.stderr)));
        }
        String::from_utf8_lossy(&output.stdout).to_string()
    };

    if let Some(parent) = Path::new(&dest_path).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Error al crear directorio: {}", e))?;
    }
    fs::write(&dest_path, content).map_err(|e| format!("Error al exportar HTML: {}", e))
}

#[tauri::command]
pub fn export_as_pdf(vault_path: String, file_path: String, dest_path: String) -> Result<(), String> {
    let source = Path::new(&vault_path).join(&file_path);
    if !source.exists() {
        return Err("El archivo no existe".to_string());
    }
    let output = Command::new("pandoc")
        .args([
            "-f", "markdown",
            "-o", &dest_path,
            "--pdf-engine=xelatex",
            source.to_str().unwrap_or_default(),
        ])
        .output()
        .map_err(|e| format!("Se requiere pandoc y xelatex para exportar a PDF: {}", e))?;
    if !output.status.success() {
        return Err(format!("Pandoc PDF error: {}", String::from_utf8_lossy(&output.stderr)));
    }
    Ok(())
}

#[tauri::command]
pub fn export_as_docx(vault_path: String, file_path: String, dest_path: String) -> Result<(), String> {
    let source = Path::new(&vault_path).join(&file_path);
    if !source.exists() {
        return Err("El archivo no existe".to_string());
    }
    let output = Command::new("pandoc")
        .args([
            "-f", "markdown",
            "-t", "docx",
            "-o", &dest_path,
            source.to_str().unwrap_or_default(),
        ])
        .output()
        .map_err(|e| format!("Se requiere pandoc para exportar a DOCX: {}", e))?;
    if !output.status.success() {
        return Err(format!("Pandoc DOCX error: {}", String::from_utf8_lossy(&output.stderr)));
    }
    Ok(())
}
