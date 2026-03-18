use std::fs;
use std::path::{Path, PathBuf};

#[tauri::command]
pub fn read_file(vault_path: String, file_path: String) -> Result<String, String> {
    let full_path = Path::new(&vault_path).join(&file_path);
    fs::read_to_string(&full_path).map_err(|e| format!("Error al leer archivo: {}", e))
}

#[tauri::command]
pub fn write_file(vault_path: String, file_path: String, content: String) -> Result<(), String> {
    let full_path = Path::new(&vault_path).join(&file_path);
    // Ensure parent directory exists
    if let Some(parent) = full_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Error al crear directorio: {}", e))?;
    }
    fs::write(&full_path, content).map_err(|e| format!("Error al escribir archivo: {}", e))
}

#[tauri::command]
pub fn create_file(vault_path: String, file_path: String) -> Result<(), String> {
    let full_path = Path::new(&vault_path).join(&file_path);
    if full_path.exists() {
        return Err("El archivo ya existe".to_string());
    }
    if let Some(parent) = full_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Error al crear directorio: {}", e))?;
    }
    fs::write(&full_path, "").map_err(|e| format!("Error al crear archivo: {}", e))
}

#[tauri::command]
pub fn create_folder(vault_path: String, folder_path: String) -> Result<(), String> {
    let full_path = Path::new(&vault_path).join(&folder_path);
    if full_path.exists() {
        return Err("La carpeta ya existe".to_string());
    }
    fs::create_dir_all(&full_path).map_err(|e| format!("Error al crear carpeta: {}", e))
}

#[tauri::command]
pub fn delete_file(vault_path: String, file_path: String) -> Result<(), String> {
    let full_path = Path::new(&vault_path).join(&file_path);
    if !full_path.exists() {
        return Err("El archivo no existe".to_string());
    }
    if full_path.is_dir() {
        fs::remove_dir_all(&full_path)
            .map_err(|e| format!("Error al eliminar carpeta: {}", e))
    } else {
        fs::remove_file(&full_path)
            .map_err(|e| format!("Error al eliminar archivo: {}", e))
    }
}

#[tauri::command]
pub fn rename_file(
    vault_path: String,
    old_path: String,
    new_path: String,
) -> Result<(), String> {
    let full_old = Path::new(&vault_path).join(&old_path);
    let full_new = Path::new(&vault_path).join(&new_path);
    if !full_old.exists() {
        return Err("El archivo origen no existe".to_string());
    }
    if full_new.exists() {
        return Err("Ya existe un archivo con ese nombre".to_string());
    }
    if let Some(parent) = full_new.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Error al crear directorio: {}", e))?;
    }
    fs::rename(&full_old, &full_new).map_err(|e| format!("Error al renombrar: {}", e))
}

#[tauri::command]
pub fn import_file(vault_path: String, source_path: String) -> Result<String, String> {
    let source = Path::new(&source_path);
    if !source.exists() {
        return Err("El archivo origen no existe".to_string());
    }
    let file_name = source
        .file_name()
        .ok_or("No se pudo obtener el nombre del archivo")?
        .to_string_lossy()
        .to_string();

    let dest = PathBuf::from(&vault_path).join(&file_name);

    // If file already exists, add a suffix
    let final_dest = if dest.exists() {
        let stem = source
            .file_stem()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        let ext = source
            .extension()
            .map(|e| format!(".{}", e.to_string_lossy()))
            .unwrap_or_default();
        let mut counter = 1u32;
        loop {
            let new_name = format!("{}-{}{}", stem, counter, ext);
            let candidate = PathBuf::from(&vault_path).join(&new_name);
            if !candidate.exists() {
                break candidate;
            }
            counter += 1;
        }
    } else {
        dest
    };

    fs::copy(&source, &final_dest).map_err(|e| format!("Error al importar: {}", e))?;

    let relative = final_dest
        .strip_prefix(&vault_path)
        .unwrap_or(&final_dest)
        .to_string_lossy()
        .to_string();
    Ok(relative)
}

#[tauri::command]
pub fn export_file(vault_path: String, file_path: String, dest_path: String) -> Result<(), String> {
    let source = Path::new(&vault_path).join(&file_path);
    if !source.exists() {
        return Err("El archivo no existe".to_string());
    }
    let dest = Path::new(&dest_path);
    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Error al crear directorio destino: {}", e))?;
    }
    fs::copy(&source, &dest).map_err(|e| format!("Error al exportar: {}", e))?;
    Ok(())
}
