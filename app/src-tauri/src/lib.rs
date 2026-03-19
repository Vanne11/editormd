mod commands;
mod models;

use commands::files;
use commands::vault;
use std::path::Path;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .register_uri_scheme_protocol("vaultimg", |_app, request| {
            let uri = request.uri().to_string();
            // URL: vaultimg://localhost/<absolute_path>
            let path = uri
                .strip_prefix("vaultimg://localhost/")
                .or_else(|| uri.strip_prefix("vaultimg://localhost"))
                .unwrap_or("");

            // Percent-decode the path
            let decoded: String = percent_decode(path.as_bytes());
            let file_path = Path::new(&decoded);

            match std::fs::read(file_path) {
                Ok(data) => {
                    let mime = match file_path.extension().and_then(|e| e.to_str()) {
                        Some("png") => "image/png",
                        Some("jpg" | "jpeg") => "image/jpeg",
                        Some("gif") => "image/gif",
                        Some("svg") => "image/svg+xml",
                        Some("webp") => "image/webp",
                        Some("bmp") => "image/bmp",
                        _ => "application/octet-stream",
                    };
                    tauri::http::Response::builder()
                        .header("content-type", mime)
                        .header("access-control-allow-origin", "*")
                        .body(data)
                        .unwrap()
                }
                Err(_) => tauri::http::Response::builder()
                    .status(404)
                    .body(Vec::new())
                    .unwrap(),
            }
        })
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            vault::get_file_tree,
            vault::get_vault_info,
            vault::count_vault_notes,
            files::read_file,
            files::write_file,
            files::create_file,
            files::create_folder,
            files::delete_file,
            files::rename_file,
            files::import_file,
            files::import_image,
            files::export_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn percent_decode(input: &[u8]) -> String {
    let mut result = Vec::new();
    let mut i = 0;
    while i < input.len() {
        if input[i] == b'%' && i + 2 < input.len() {
            if let Ok(byte) = u8::from_str_radix(
                &String::from_utf8_lossy(&input[i + 1..i + 3]),
                16,
            ) {
                result.push(byte);
                i += 3;
                continue;
            }
        }
        result.push(input[i]);
        i += 1;
    }
    String::from_utf8_lossy(&result).to_string()
}
