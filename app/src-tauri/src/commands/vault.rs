use crate::models::FileEntry;
use std::path::Path;
use walkdir::WalkDir;

fn build_tree(dir: &Path, base: &Path) -> Vec<FileEntry> {
    let mut entries: Vec<FileEntry> = Vec::new();

    if let Ok(read_dir) = std::fs::read_dir(dir) {
        let mut items: Vec<_> = read_dir.filter_map(|e| e.ok()).collect();
        items.sort_by(|a, b| {
            let a_is_dir = a.file_type().map(|ft| ft.is_dir()).unwrap_or(false);
            let b_is_dir = b.file_type().map(|ft| ft.is_dir()).unwrap_or(false);
            b_is_dir.cmp(&a_is_dir).then_with(|| {
                a.file_name()
                    .to_string_lossy()
                    .to_lowercase()
                    .cmp(&b.file_name().to_string_lossy().to_lowercase())
            })
        });

        for item in items {
            let name = item.file_name().to_string_lossy().to_string();

            // Skip hidden files/dirs and .editormd
            if name.starts_with('.') {
                continue;
            }

            let path = item.path();
            let relative = path
                .strip_prefix(base)
                .unwrap_or(&path)
                .to_string_lossy()
                .to_string();
            let is_dir = item.file_type().map(|ft| ft.is_dir()).unwrap_or(false);

            if is_dir {
                let children = build_tree(&path, base);
                entries.push(FileEntry {
                    name,
                    path: relative,
                    is_dir: true,
                    children: Some(children),
                    file_type: None,
                });
            } else {
                let file_type = path
                    .extension()
                    .and_then(|e| e.to_str())
                    .map(|e| e.to_lowercase());
                entries.push(FileEntry {
                    name,
                    path: relative,
                    is_dir: false,
                    children: None,
                    file_type,
                });
            }
        }
    }

    entries
}

#[tauri::command]
pub fn get_file_tree(vault_path: String) -> Result<Vec<FileEntry>, String> {
    let path = Path::new(&vault_path);
    if !path.exists() {
        return Err("La ruta de la bóveda no existe".to_string());
    }
    Ok(build_tree(path, path))
}

#[tauri::command]
pub fn get_vault_info(vault_path: String) -> Result<crate::models::VaultInfo, String> {
    let path = Path::new(&vault_path);
    if !path.exists() {
        return Err("La ruta de la bóveda no existe".to_string());
    }
    let name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Bóveda".to_string());
    Ok(crate::models::VaultInfo {
        path: vault_path,
        name,
    })
}

#[tauri::command]
pub fn count_vault_notes(vault_path: String) -> Result<usize, String> {
    let path = Path::new(&vault_path);
    if !path.exists() {
        return Err("La ruta de la bóveda no existe".to_string());
    }
    let count = WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.file_type().is_file()
                && e.path()
                    .extension()
                    .map(|ext| ext == "md" || ext == "markdown")
                    .unwrap_or(false)
        })
        .count();
    Ok(count)
}
