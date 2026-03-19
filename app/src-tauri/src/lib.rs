mod commands;
mod models;

use commands::files;
use commands::vault;
use commands::import;
use commands::export;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
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
            files::read_image_base64,
            import::import_file_smart,
            export::export_as_txt,
            export::export_as_html,
            export::export_as_pdf,
            export::export_as_docx,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
