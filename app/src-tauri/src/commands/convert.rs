use pulldown_cmark::{html, Options, Parser};
use std::path::Path;

pub fn md_options() -> Options {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    options
}

/// Convierte markdown a HTML standalone con imágenes embebidas como base64
pub fn markdown_to_html(markdown: &str, title: &str, vault_path: &str) -> String {
    let parser = Parser::new_ext(markdown, md_options());
    let mut body = String::new();
    html::push_html(&mut body, parser);

    // Post-procesar: reemplazar src de imágenes locales con base64
    body = embed_local_images_html(&body, vault_path);

    // Transformar bloques <pre><code class="language-mermaid"> a <pre class="mermaid">
    body = transform_mermaid_blocks(&body);

    format!(
        r#"<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{}</title>
  <style>
    body {{ font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #1a1a1a; }}
    pre {{ background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; }}
    code {{ background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }}
    pre code {{ background: none; padding: 0; }}
    pre.mermaid {{ background: none; text-align: center; }}
    blockquote {{ border-left: 4px solid #ddd; margin-left: 0; padding-left: 1rem; color: #555; }}
    img {{ max-width: 100%; }}
    table {{ border-collapse: collapse; width: 100%; }}
    th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
    th {{ background: #f4f4f4; }}
  </style>
</head>
<body>
{}
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  mermaid.initialize({{ startOnLoad: true, theme: 'default' }});
</script>
</body>
</html>"#,
        escape_html(title),
        body
    )
}

/// Convierte HTML a Markdown usando html2md
pub fn html_to_markdown(html: &str) -> String {
    html2md::parse_html(html)
}

/// Resuelve una ruta de imagen relativa al vault
pub fn resolve_image_path(src: &str, vault_path: &str) -> Option<std::path::PathBuf> {
    // Ignorar URLs externas
    if src.starts_with("http://") || src.starts_with("https://") || src.starts_with("data:") {
        return None;
    }

    // Intentar ruta directa
    let path = Path::new(vault_path).join(src);
    if path.exists() {
        return Some(path);
    }

    // Intentar con URL-decoding (espacios como %20, etc.)
    let decoded = percent_decode(src);
    if decoded != src {
        let path = Path::new(vault_path).join(&decoded);
        if path.exists() {
            return Some(path);
        }
    }

    // Intentar solo el nombre del archivo en assets/
    if let Some(file_name) = Path::new(src).file_name() {
        let path = Path::new(vault_path).join("assets").join(file_name);
        if path.exists() {
            return Some(path);
        }
    }

    log::warn!("Imagen no encontrada: {} (vault: {})", src, vault_path);
    None
}

/// Decodifica caracteres percent-encoded (%20 → espacio, etc.)
fn percent_decode(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let bytes = s.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(byte) = u8::from_str_radix(
                &s[i + 1..i + 3],
                16,
            ) {
                result.push(byte as char);
                i += 3;
                continue;
            }
        }
        result.push(bytes[i] as char);
        i += 1;
    }
    result
}

/// Obtiene el MIME type de una imagen por extensión
pub fn mime_for_image(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase()
        .as_str()
    {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "svg" => "image/svg+xml",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        _ => "application/octet-stream",
    }
}

/// Reemplaza rutas de imágenes locales en HTML con data URIs base64
fn embed_local_images_html(html: &str, vault_path: &str) -> String {
    use base64::Engine;

    let mut result = html.to_string();
    // Buscar patrones src="..." en tags img
    let mut search_from = 0;
    while let Some(src_pos) = result[search_from..].find("src=\"") {
        let abs_pos = search_from + src_pos + 5; // después de src="
        if let Some(end_quote) = result[abs_pos..].find('"') {
            let src = result[abs_pos..abs_pos + end_quote].to_string();
            if let Some(img_path) = resolve_image_path(&src, vault_path) {
                if let Ok(data) = std::fs::read(&img_path) {
                    let mime = mime_for_image(&img_path);
                    let b64 = base64::engine::general_purpose::STANDARD.encode(&data);
                    let data_uri = format!("data:{};base64,{}", mime, b64);
                    result = format!(
                        "{}{}{}",
                        &result[..abs_pos],
                        data_uri,
                        &result[abs_pos + end_quote..]
                    );
                    search_from = abs_pos + data_uri.len() + 1;
                    continue;
                }
            }
            search_from = abs_pos + end_quote + 1;
        } else {
            break;
        }
    }
    result
}

/// Transforma <pre><code class="language-mermaid">...</code></pre> a <pre class="mermaid">...</pre>
fn transform_mermaid_blocks(html: &str) -> String {
    let mut result = html.to_string();
    let open_tag = r#"<pre><code class="language-mermaid">"#;
    let close_tag = "</code></pre>";
    while let Some(start) = result.find(open_tag) {
        let content_start = start + open_tag.len();
        if let Some(end_offset) = result[content_start..].find(close_tag) {
            let content = result[content_start..content_start + end_offset].to_string();
            let replacement = format!(r#"<pre class="mermaid">{}</pre>"#, content);
            result = format!(
                "{}{}{}",
                &result[..start],
                replacement,
                &result[content_start + end_offset + close_tag.len()..]
            );
        } else {
            break;
        }
    }
    result
}

fn escape_html(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}
