use crate::models::{SearchMatch, SearchResult};
use std::path::Path;
use walkdir::WalkDir;

const MAX_RESULTS: usize = 100;
const MAX_MATCHES_PER_FILE: usize = 5;
const SNIPPET_MAX_LEN: usize = 160;

fn is_markdown(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| {
            let e = e.to_lowercase();
            e == "md" || e == "markdown"
        })
        .unwrap_or(false)
}

fn make_snippet(line: &str) -> String {
    let trimmed = line.trim();
    if trimmed.chars().count() <= SNIPPET_MAX_LEN {
        trimmed.to_string()
    } else {
        let truncated: String = trimmed.chars().take(SNIPPET_MAX_LEN).collect();
        format!("{}…", truncated)
    }
}

/// Busca en la bóveda por nombre de archivo y por contenido (insensible a
/// mayúsculas). Devuelve hasta MAX_RESULTS notas, cada una con los primeros
/// fragmentos de línea coincidentes.
#[tauri::command]
pub fn search_vault(vault_path: String, query: String) -> Result<Vec<SearchResult>, String> {
    let base = Path::new(&vault_path);
    if !base.exists() {
        return Err("La ruta de la bóveda no existe".to_string());
    }

    let needle = query.trim().to_lowercase();
    if needle.is_empty() {
        return Ok(Vec::new());
    }

    let mut results: Vec<SearchResult> = Vec::new();

    for entry in WalkDir::new(base).into_iter().filter_map(|e| e.ok()) {
        if results.len() >= MAX_RESULTS {
            break;
        }

        let path = entry.path();
        if !entry.file_type().is_file() || !is_markdown(path) {
            continue;
        }

        // Saltar archivos/carpetas ocultos (p. ej. .git, .editormd).
        if path
            .components()
            .any(|c| c.as_os_str().to_string_lossy().starts_with('.'))
        {
            continue;
        }

        let name = path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();
        let relative = path
            .strip_prefix(base)
            .unwrap_or(path)
            .to_string_lossy()
            .to_string();

        let name_match = name.to_lowercase().contains(&needle);

        let mut matches: Vec<SearchMatch> = Vec::new();
        if let Ok(content) = std::fs::read_to_string(path) {
            for (idx, line) in content.lines().enumerate() {
                if matches.len() >= MAX_MATCHES_PER_FILE {
                    break;
                }
                if line.to_lowercase().contains(&needle) {
                    matches.push(SearchMatch {
                        line: idx + 1,
                        text: make_snippet(line),
                    });
                }
            }
        }

        if name_match || !matches.is_empty() {
            results.push(SearchResult {
                path: relative,
                name,
                name_match,
                matches,
            });
        }
    }

    // Coincidencias por nombre primero, luego alfabético.
    results.sort_by(|a, b| {
        b.name_match
            .cmp(&a.name_match)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    Ok(results)
}
