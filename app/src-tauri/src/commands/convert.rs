use std::process::Command;

#[tauri::command]
pub fn check_pandoc_available() -> bool {
    Command::new("pandoc")
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

#[tauri::command]
pub fn convert_to_markdown(source_path: String, format: String) -> Result<String, String> {
    let output = Command::new("pandoc")
        .args(["-f", &format, "-t", "markdown", "--wrap=none", &source_path])
        .output()
        .map_err(|e| format!("Error al ejecutar pandoc: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Pandoc error: {}", stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}
