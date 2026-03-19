use std::fs;
use std::io::BufWriter;
use std::path::Path;

use pulldown_cmark::{Event, Parser, Tag, TagEnd};

#[tauri::command]
pub fn export_as_txt(
    vault_path: String,
    file_path: String,
    dest_path: String,
) -> Result<(), String> {
    let source = Path::new(&vault_path).join(&file_path);
    if !source.exists() {
        return Err("El archivo no existe".to_string());
    }
    let content =
        fs::read_to_string(&source).map_err(|e| format!("Error al leer archivo: {}", e))?;
    ensure_parent(&dest_path)?;
    fs::write(&dest_path, content).map_err(|e| format!("Error al exportar TXT: {}", e))
}

#[tauri::command]
pub fn export_as_html(
    vault_path: String,
    file_path: String,
    dest_path: String,
) -> Result<(), String> {
    let source = Path::new(&vault_path).join(&file_path);
    if !source.exists() {
        return Err("El archivo no existe".to_string());
    }
    let markdown =
        fs::read_to_string(&source).map_err(|e| format!("Error al leer archivo: {}", e))?;
    let title = Path::new(&file_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Export");
    let html = super::convert::markdown_to_html(&markdown, title, &vault_path);
    ensure_parent(&dest_path)?;
    fs::write(&dest_path, html).map_err(|e| format!("Error al exportar HTML: {}", e))
}

#[tauri::command]
pub fn export_as_pdf(
    vault_path: String,
    file_path: String,
    dest_path: String,
    mermaid_images: Vec<String>,
) -> Result<(), String> {
    let source = Path::new(&vault_path).join(&file_path);
    if !source.exists() {
        return Err("El archivo no existe".to_string());
    }
    let markdown =
        fs::read_to_string(&source).map_err(|e| format!("Error al leer archivo: {}", e))?;

    let font_family = load_font_family()?;
    let mut doc = genpdf::Document::new(font_family);
    doc.set_title(
        Path::new(&file_path)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Export"),
    );
    doc.set_minimal_conformance();

    let mut decorator = genpdf::SimplePageDecorator::new();
    decorator.set_margins(genpdf::Margins::trbl(20, 15, 20, 15));
    doc.set_page_decorator(decorator);

    log::info!("[mermaid] export_as_pdf: recibidas {} imágenes mermaid", mermaid_images.len());
    for (i, img) in mermaid_images.iter().enumerate() {
        log::info!("[mermaid] imagen[{}] len={}", i, img.len());
    }
    render_markdown_to_pdf(&mut doc, &markdown, &vault_path, &mermaid_images);

    ensure_parent(&dest_path)?;
    doc.render_to_file(&dest_path)
        .map_err(|e| format!("Error al generar PDF: {}", e))
}

#[tauri::command]
pub fn export_as_docx(
    vault_path: String,
    file_path: String,
    dest_path: String,
    mermaid_images: Vec<String>,
) -> Result<(), String> {
    let source = Path::new(&vault_path).join(&file_path);
    if !source.exists() {
        return Err("El archivo no existe".to_string());
    }
    let markdown =
        fs::read_to_string(&source).map_err(|e| format!("Error al leer archivo: {}", e))?;

    let docx = render_markdown_to_docx(&markdown, &vault_path, &mermaid_images);

    ensure_parent(&dest_path)?;
    let file = fs::File::create(&dest_path)
        .map_err(|e| format!("Error al crear archivo DOCX: {}", e))?;
    let writer = BufWriter::new(file);
    docx.build()
        .pack(writer)
        .map_err(|e| format!("Error al escribir DOCX: {}", e))
}

// --- Helpers ---

fn ensure_parent(path: &str) -> Result<(), String> {
    if let Some(parent) = Path::new(path).parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Error al crear directorio: {}", e))?;
    }
    Ok(())
}

fn load_font_family() -> Result<genpdf::fonts::FontFamily<genpdf::fonts::FontData>, String> {
    // Buscar fuentes del sistema en ubicaciones comunes
    let font_dirs = [
        "/usr/share/fonts/TTF",
        "/usr/share/fonts/truetype/dejavu",
        "/usr/share/fonts/truetype/liberation",
        "/usr/share/fonts/liberation-sans",
        "/usr/share/fonts/noto",
        "/System/Library/Fonts",
        "C:\\Windows\\Fonts",
    ];

    // Intentar DejaVuSans (Linux/CachyOS)
    for dir in &font_dirs {
        let dir_path = Path::new(dir);
        if !dir_path.exists() {
            continue;
        }
        // DejaVuSans usa Oblique en vez de Italic, y sin sufijo -Regular
        let regular = dir_path.join("DejaVuSans.ttf");
        let bold = dir_path.join("DejaVuSans-Bold.ttf");
        let italic = dir_path.join("DejaVuSans-Oblique.ttf");
        let bold_italic = dir_path.join("DejaVuSans-BoldOblique.ttf");
        if regular.exists() && bold.exists() && italic.exists() && bold_italic.exists() {
            return Ok(genpdf::fonts::FontFamily {
                regular: genpdf::fonts::FontData::new(
                    fs::read(&regular).map_err(|e| e.to_string())?,
                    None,
                )
                .map_err(|e| e.to_string())?,
                bold: genpdf::fonts::FontData::new(
                    fs::read(&bold).map_err(|e| e.to_string())?,
                    None,
                )
                .map_err(|e| e.to_string())?,
                italic: genpdf::fonts::FontData::new(
                    fs::read(&italic).map_err(|e| e.to_string())?,
                    None,
                )
                .map_err(|e| e.to_string())?,
                bold_italic: genpdf::fonts::FontData::new(
                    fs::read(&bold_italic).map_err(|e| e.to_string())?,
                    None,
                )
                .map_err(|e| e.to_string())?,
            });
        }

        // LiberationSans (nombre estándar con -Regular)
        if let Ok(family) = genpdf::fonts::from_files(dir, "LiberationSans", None) {
            return Ok(family);
        }
    }

    // Fallback: usar fuente builtin de PDF (Helvetica)
    // No soporta Unicode extendido pero funciona siempre
    genpdf::fonts::from_files(".", "nonexistent", Some(genpdf::fonts::Builtin::Helvetica))
        .map_err(|_| {
            "No se encontraron fuentes del sistema. Instala dejavu-fonts o liberation-fonts."
                .to_string()
        })
}

fn render_markdown_to_pdf(doc: &mut genpdf::Document, markdown: &str, vault_path: &str, mermaid_images: &[String]) {
    use genpdf::elements;
    use genpdf::style;
    use genpdf::Element as _;

    let parser = Parser::new_ext(markdown, super::convert::md_options());

    let mut bold = false;
    let mut italic = false;
    let mut heading_level: Option<u8> = None;
    let mut in_code_block = false;
    let mut in_mermaid_block = false;
    let mut in_image = false;
    let mut code_block_text = String::new();
    let mut current_paragraph_parts: Vec<(String, style::Style)> = Vec::new();
    let mut list_ordered = false;
    let mut list_item_idx = 0u32;
    let mut mermaid_idx = 0usize;

    for event in parser {
        match event {
            Event::Start(Tag::Heading { level, .. }) => {
                flush_paragraph(doc, &mut current_paragraph_parts);
                heading_level = Some(level as u8);
            }
            Event::End(TagEnd::Heading(_)) => {
                let level = heading_level.take().unwrap_or(1);
                let text: String = current_paragraph_parts
                    .drain(..)
                    .map(|(t, _)| t)
                    .collect();
                let size = match level {
                    1 => 22,
                    2 => 18,
                    3 => 15,
                    _ => 13,
                };
                doc.push(
                    elements::Paragraph::new(text)
                        .styled(style::Style::new().bold().with_font_size(size)),
                );
                doc.push(elements::Break::new(0.5));
            }
            Event::Start(Tag::Paragraph) => {}
            Event::End(TagEnd::Paragraph) => {
                flush_paragraph(doc, &mut current_paragraph_parts);
                doc.push(elements::Break::new(0.3));
            }
            Event::Start(Tag::Strong) => bold = true,
            Event::End(TagEnd::Strong) => bold = false,
            Event::Start(Tag::Emphasis) => italic = true,
            Event::End(TagEnd::Emphasis) => italic = false,
            Event::Start(Tag::CodeBlock(kind)) => {
                flush_paragraph(doc, &mut current_paragraph_parts);
                let lang = match &kind {
                    pulldown_cmark::CodeBlockKind::Fenced(lang) => lang.as_ref(),
                    _ => "",
                };
                in_mermaid_block = lang == "mermaid";
                in_code_block = true;
                code_block_text.clear();
            }
            Event::End(TagEnd::CodeBlock) => {
                in_code_block = false;
                if in_mermaid_block {
                    in_mermaid_block = false;
                    let svg_str = mermaid_images.get(mermaid_idx).map(|s| s.as_str()).unwrap_or("");
                    mermaid_idx += 1;
                    if !svg_str.is_empty() {
                        if let Some((genpdf_img, scale)) = load_mermaid_for_pdf(svg_str) {
                            doc.push(
                                genpdf_img
                                    .with_scale(genpdf::Scale::new(scale, scale))
                                    .with_alignment(genpdf::Alignment::Center),
                            );
                            doc.push(elements::Break::new(0.3));
                        }
                    }
                } else {
                    doc.push(
                        elements::Paragraph::new(&code_block_text)
                            .styled(style::Style::new().with_font_size(9)),
                    );
                    doc.push(elements::Break::new(0.3));
                }
                code_block_text.clear();
            }
            Event::Start(Tag::List(ordered)) => {
                flush_paragraph(doc, &mut current_paragraph_parts);
                list_ordered = ordered.is_some();
                list_item_idx = ordered.unwrap_or(1) as u32;
            }
            Event::End(TagEnd::List(_)) => {
                doc.push(elements::Break::new(0.2));
            }
            Event::Start(Tag::Item) => {
                flush_paragraph(doc, &mut current_paragraph_parts);
                if list_ordered {
                    current_paragraph_parts.push((
                        format!("  {}. ", list_item_idx),
                        style::Style::new(),
                    ));
                    list_item_idx += 1;
                } else {
                    current_paragraph_parts
                        .push(("  • ".to_string(), style::Style::new()));
                }
            }
            Event::End(TagEnd::Item) => {
                flush_paragraph(doc, &mut current_paragraph_parts);
            }
            Event::Start(Tag::BlockQuote(_)) => {
                flush_paragraph(doc, &mut current_paragraph_parts);
                current_paragraph_parts.push(("│ ".to_string(), style::Style::new().italic()));
            }
            Event::End(TagEnd::BlockQuote(_)) => {
                flush_paragraph(doc, &mut current_paragraph_parts);
            }
            Event::Code(text) => {
                current_paragraph_parts.push((
                    format!("`{}`", text),
                    style::Style::new().with_font_size(9),
                ));
            }
            Event::Text(text) => {
                if in_image {
                    // Skip alt text of images
                } else if in_code_block {
                    code_block_text.push_str(&text);
                } else {
                    let mut s = style::Style::new();
                    if bold {
                        s = s.bold();
                    }
                    if italic {
                        s = s.italic();
                    }
                    if heading_level.is_some() {
                        // Will be handled in End(Heading)
                    }
                    current_paragraph_parts.push((text.to_string(), s));
                }
            }
            Event::SoftBreak | Event::HardBreak => {
                if in_code_block {
                    code_block_text.push('\n');
                } else {
                    current_paragraph_parts.push((" ".to_string(), style::Style::new()));
                }
            }
            Event::Rule => {
                flush_paragraph(doc, &mut current_paragraph_parts);
                doc.push(
                    elements::Paragraph::new("────────────────────────────────")
                        .styled(style::Style::new().with_font_size(8)),
                );
                doc.push(elements::Break::new(0.3));
            }
            Event::Start(Tag::Image { dest_url, .. }) => {
                flush_paragraph(doc, &mut current_paragraph_parts);
                in_image = true;
                log::debug!("PDF: procesando imagen: {}", dest_url);
                if let Some(img_path) =
                    super::convert::resolve_image_path(&dest_url, vault_path)
                {
                    if let Some((genpdf_img, scale)) = load_image_for_pdf(&img_path) {
                        doc.push(
                            genpdf_img
                                .with_scale(genpdf::Scale::new(scale, scale))
                                .with_alignment(genpdf::Alignment::Center),
                        );
                        doc.push(elements::Break::new(0.3));
                    }
                }
            }
            Event::End(TagEnd::Image) => {
                in_image = false;
            }
            _ => {}
        }
    }
    flush_paragraph(doc, &mut current_paragraph_parts);
}

fn flush_paragraph(
    doc: &mut genpdf::Document,
    parts: &mut Vec<(String, genpdf::style::Style)>,
) {
    if parts.is_empty() {
        return;
    }
    use genpdf::elements;
    let mut paragraph = elements::Paragraph::default();
    for (text, style) in parts.drain(..) {
        paragraph.push_styled(text, style);
    }
    doc.push(paragraph);
}

fn render_markdown_to_docx(markdown: &str, vault_path: &str, mermaid_images: &[String]) -> docx_rs::Docx {
    use docx_rs::*;

    let parser = Parser::new_ext(markdown, super::convert::md_options());

    let mut docx = Docx::new();
    let mut bold = false;
    let mut italic = false;
    let mut strikethrough = false;
    let mut in_image = false;
    let mut heading_level: Option<u8> = None;
    let mut in_code_block = false;
    let mut in_mermaid_block = false;
    let mut code_block_text = String::new();
    let mut current_runs: Vec<Run> = Vec::new();
    let mut list_ordered = false;
    let mut list_item_idx = 0u32;
    let mut mermaid_idx = 0usize;

    for event in parser {
        match event {
            Event::Start(Tag::Heading { level, .. }) => {
                flush_docx_paragraph(&mut docx, &mut current_runs, None);
                heading_level = Some(level as u8);
            }
            Event::End(TagEnd::Heading(_)) => {
                let level = heading_level.take().unwrap_or(1);
                let style_name = format!("Heading{}", level);
                flush_docx_paragraph(&mut docx, &mut current_runs, Some(&style_name));
            }
            Event::Start(Tag::Paragraph) => {}
            Event::End(TagEnd::Paragraph) => {
                flush_docx_paragraph(&mut docx, &mut current_runs, None);
            }
            Event::Start(Tag::Strong) => bold = true,
            Event::End(TagEnd::Strong) => bold = false,
            Event::Start(Tag::Emphasis) => italic = true,
            Event::End(TagEnd::Emphasis) => italic = false,
            Event::Start(Tag::Strikethrough) => strikethrough = true,
            Event::End(TagEnd::Strikethrough) => strikethrough = false,
            Event::Start(Tag::CodeBlock(kind)) => {
                flush_docx_paragraph(&mut docx, &mut current_runs, None);
                let lang = match &kind {
                    pulldown_cmark::CodeBlockKind::Fenced(lang) => lang.as_ref(),
                    _ => "",
                };
                in_mermaid_block = lang == "mermaid";
                in_code_block = true;
                code_block_text.clear();
            }
            Event::End(TagEnd::CodeBlock) => {
                in_code_block = false;
                if in_mermaid_block {
                    in_mermaid_block = false;
                    let svg_str = mermaid_images.get(mermaid_idx).map(|s| s.as_str()).unwrap_or("");
                    mermaid_idx += 1;
                    if !svg_str.is_empty() {
                        if let Some(pic) = load_mermaid_for_docx(svg_str) {
                            let run = Run::new().add_image(pic);
                            docx = docx.add_paragraph(Paragraph::new().add_run(run));
                        }
                    }
                } else {
                    for line in code_block_text.lines() {
                        let run = Run::new()
                            .add_text(line)
                            .size(18)
                            .fonts(RunFonts::new().ascii("Courier New"));
                        docx = docx.add_paragraph(Paragraph::new().add_run(run));
                    }
                }
                code_block_text.clear();
            }
            Event::Start(Tag::List(ordered)) => {
                flush_docx_paragraph(&mut docx, &mut current_runs, None);
                list_ordered = ordered.is_some();
                list_item_idx = ordered.unwrap_or(1) as u32;
            }
            Event::End(TagEnd::List(_)) => {}
            Event::Start(Tag::Item) => {
                flush_docx_paragraph(&mut docx, &mut current_runs, None);
                if list_ordered {
                    current_runs.push(Run::new().add_text(format!("{}. ", list_item_idx)));
                    list_item_idx += 1;
                } else {
                    current_runs.push(Run::new().add_text("• "));
                }
            }
            Event::End(TagEnd::Item) => {
                flush_docx_paragraph(&mut docx, &mut current_runs, None);
            }
            Event::Start(Tag::BlockQuote(_)) => {
                flush_docx_paragraph(&mut docx, &mut current_runs, None);
            }
            Event::End(TagEnd::BlockQuote(_)) => {
                flush_docx_paragraph(&mut docx, &mut current_runs, None);
            }
            Event::Code(text) => {
                let run = Run::new()
                    .add_text(text.to_string())
                    .size(18)
                    .fonts(RunFonts::new().ascii("Courier New"));
                current_runs.push(run);
            }
            Event::Text(text) => {
                if in_image {
                    // Skip alt text of images
                } else if in_code_block {
                    code_block_text.push_str(&text);
                } else {
                    let mut run = Run::new().add_text(text.to_string());
                    if bold {
                        run = run.bold();
                    }
                    if italic {
                        run = run.italic();
                    }
                    if strikethrough {
                        run = run.strike();
                    }
                    if heading_level.is_some() {
                        let size = match heading_level.unwrap_or(1) {
                            1 => 44, // 22pt
                            2 => 36, // 18pt
                            3 => 30, // 15pt
                            _ => 26,
                        };
                        run = run.size(size).bold();
                    }
                    current_runs.push(run);
                }
            }
            Event::SoftBreak => {
                if in_code_block {
                    code_block_text.push('\n');
                } else {
                    current_runs.push(Run::new().add_text(" "));
                }
            }
            Event::HardBreak => {
                if in_code_block {
                    code_block_text.push('\n');
                } else {
                    current_runs
                        .push(Run::new().add_break(docx_rs::BreakType::TextWrapping));
                }
            }
            Event::Rule => {
                flush_docx_paragraph(&mut docx, &mut current_runs, None);
                docx = docx.add_paragraph(
                    Paragraph::new().add_run(
                        Run::new()
                            .add_text("────────────────────────────────")
                            .size(16)
                            .color("999999"),
                    ),
                );
            }
            Event::Start(Tag::Image { dest_url, .. }) => {
                flush_docx_paragraph(&mut docx, &mut current_runs, None);
                in_image = true;
                log::debug!("DOCX: procesando imagen: {}", dest_url);
                if let Some(img_path) =
                    super::convert::resolve_image_path(&dest_url, vault_path)
                {
                    if let Some(pic) = load_image_for_docx(&img_path) {
                        let run = Run::new().add_image(pic);
                        docx = docx.add_paragraph(Paragraph::new().add_run(run));
                    }
                }
            }
            Event::End(TagEnd::Image) => {
                in_image = false;
            }
            _ => {}
        }
    }
    flush_docx_paragraph(&mut docx, &mut current_runs, None);
    docx
}

fn flush_docx_paragraph(
    docx: &mut docx_rs::Docx,
    runs: &mut Vec<docx_rs::Run>,
    style: Option<&str>,
) {
    if runs.is_empty() {
        return;
    }
    let mut p = docx_rs::Paragraph::new();
    if let Some(s) = style {
        p = p.style(s);
    }
    for run in runs.drain(..) {
        p = p.add_run(run);
    }
    *docx = std::mem::take(docx).add_paragraph(p);
}

/// Carga imagen para PDF: decodifica con image 0.25, convierte a PNG bytes para genpdf
fn load_image_for_pdf(path: &Path) -> Option<(genpdf::elements::Image, f64)> {
    use image::GenericImageView;
    use std::io::Cursor;

    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    // SVG no es soportado por el crate image — no se puede rasterizar sin resvg
    if ext == "svg" {
        log::warn!("SVG no soportado en export PDF: {}", path.display());
        return None;
    }

    let data = match fs::read(path) {
        Ok(d) => d,
        Err(e) => {
            log::error!("No se pudo leer imagen {}: {}", path.display(), e);
            return None;
        }
    };

    let img = match image::load_from_memory(&data) {
        Ok(i) => i,
        Err(e) => {
            log::error!("No se pudo decodificar imagen {}: {}", path.display(), e);
            return None;
        }
    };
    let (px_w, _px_h) = img.dimensions();

    // Convertir a RGB8 (quita alpha) y luego a PNG bytes en memoria
    // genpdf usa image 0.23 internamente, así que le pasamos PNG via from_reader
    let rgb = img.to_rgb8();
    let mut png_buf = Cursor::new(Vec::new());
    if let Err(e) = image::DynamicImage::ImageRgb8(rgb)
        .write_to(&mut png_buf, image::ImageFormat::Png)
    {
        log::error!("No se pudo convertir a PNG {}: {}", path.display(), e);
        return None;
    }

    let png_bytes = png_buf.into_inner();
    let genpdf_img = match genpdf::elements::Image::from_reader(Cursor::new(png_bytes)) {
        Ok(i) => i,
        Err(e) => {
            log::error!("genpdf no pudo cargar imagen {}: {}", path.display(), e);
            return None;
        }
    };

    // Calcular escala: A4 con márgenes 15mm → 180mm disponibles
    let dpi = 300.0;
    let mmpi = 25.4;
    let max_width_mm = 180.0;
    let img_width_mm = (px_w as f64 / dpi) * mmpi;
    let scale = if img_width_mm > max_width_mm {
        max_width_mm / img_width_mm
    } else {
        1.0
    };

    Some((genpdf_img, scale))
}

/// Carga imagen para DOCX: convierte a PNG sin paniquear
fn load_image_for_docx(path: &Path) -> Option<docx_rs::Pic> {
    use image::GenericImageView;

    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    if ext == "svg" {
        log::warn!("SVG no soportado en export DOCX: {}", path.display());
        return None;
    }

    let data = match fs::read(path) {
        Ok(d) => d,
        Err(e) => {
            log::error!("No se pudo leer imagen {}: {}", path.display(), e);
            return None;
        }
    };

    let img = match image::load_from_memory(&data) {
        Ok(i) => i,
        Err(e) => {
            log::error!("No se pudo decodificar imagen {}: {}", path.display(), e);
            return None;
        }
    };
    let (w, h) = img.dimensions();

    // Convertir a PNG en memoria para máxima compatibilidad
    let mut png_buf = std::io::Cursor::new(Vec::new());
    if let Err(e) = img.write_to(&mut png_buf, image::ImageFormat::Png) {
        log::error!("No se pudo convertir a PNG {}: {}", path.display(), e);
        return None;
    }

    Some(docx_rs::Pic::new_with_dimensions(png_buf.into_inner(), w, h))
}

/// Rasteriza SVG a bytes PNG usando resvg
fn svg_to_png_bytes(svg_str: &str) -> Option<(Vec<u8>, u32, u32)> {
    log::info!("[mermaid] svg_to_png_bytes llamado, SVG len={}", svg_str.len());
    if svg_str.is_empty() {
        log::warn!("[mermaid] SVG vacío, retornando None");
        return None;
    }
    log::info!("[mermaid] SVG primeros 200 chars: {}", &svg_str[..svg_str.len().min(200)]);

    let mut opts = resvg::usvg::Options::default();
    // Cargar fuentes del sistema para que resvg pueda renderizar texto
    let mut fontdb = resvg::usvg::fontdb::Database::new();
    fontdb.load_system_fonts();
    log::info!("[mermaid] fontdb cargada con {} fuentes", fontdb.len());
    opts.fontdb = std::sync::Arc::new(fontdb);

    let tree = match resvg::usvg::Tree::from_str(svg_str, &opts) {
        Ok(t) => t,
        Err(e) => {
            log::error!("[mermaid] No se pudo parsear SVG: {}", e);
            return None;
        }
    };
    let size = tree.size();
    let (w, h) = (size.width() as u32, size.height() as u32);
    log::info!("[mermaid] Dimensiones: {}x{}", w, h);
    if w == 0 || h == 0 {
        log::warn!("[mermaid] Dimensiones 0, retornando None");
        return None;
    }
    // Escalar 2x para buena calidad
    let scale = 2.0;
    let sw = (w as f32 * scale) as u32;
    let sh = (h as f32 * scale) as u32;
    let mut pixmap = resvg::tiny_skia::Pixmap::new(sw, sh)?;
    pixmap.fill(resvg::tiny_skia::Color::WHITE);
    let transform = resvg::tiny_skia::Transform::from_scale(scale, scale);
    resvg::render(&tree, transform, &mut pixmap.as_mut());

    // Convertir RGBA → RGB (genpdf no soporta alpha)
    let rgba = pixmap.data();
    let rgb: Vec<u8> = rgba.chunks(4).flat_map(|px| [px[0], px[1], px[2]]).collect();
    let mut png_buf: Vec<u8> = Vec::new();
    {
        let mut encoder = png::Encoder::new(&mut png_buf, sw, sh);
        encoder.set_color(png::ColorType::Rgb);
        encoder.set_depth(png::BitDepth::Eight);
        let mut writer = encoder.write_header().ok()?;
        writer.write_image_data(&rgb).ok()?;
    }
    Some((png_buf, sw, sh))
}

/// Carga SVG mermaid como imagen para genpdf
fn load_mermaid_for_pdf(svg_str: &str) -> Option<(genpdf::elements::Image, f64)> {
    use std::io::Cursor;

    let (png, px_w, _) = svg_to_png_bytes(svg_str)?;
    let genpdf_img = match genpdf::elements::Image::from_reader(Cursor::new(png)) {
        Ok(i) => i,
        Err(e) => {
            log::error!("genpdf no pudo cargar imagen mermaid: {}", e);
            return None;
        }
    };

    let dpi = 96.0;
    let mmpi = 25.4;
    let max_width_mm = 180.0;
    let img_width_mm = (px_w as f64 / dpi) * mmpi;
    let scale = if img_width_mm > max_width_mm {
        max_width_mm / img_width_mm
    } else {
        1.0
    };

    Some((genpdf_img, scale))
}

/// Carga SVG mermaid como imagen para DOCX
fn load_mermaid_for_docx(svg_str: &str) -> Option<docx_rs::Pic> {
    let (png, w, h) = svg_to_png_bytes(svg_str)?;
    Some(docx_rs::Pic::new_with_dimensions(png, w, h))
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_load_image_for_pdf_png() {
        // Create a temp PNG file
        let img = image::RgbImage::from_fn(100, 80, |x, y| {
            image::Rgb([(x % 256) as u8, (y % 256) as u8, 128])
        });
        let tmp = std::env::temp_dir().join("editormd_test_pdf.png");
        img.save(&tmp).unwrap();
        
        let result = load_image_for_pdf(&tmp);
        std::fs::remove_file(&tmp).ok();
        assert!(result.is_some(), "PNG should load for PDF");
    }
    
    #[test]
    fn test_load_image_for_pdf_rgba() {
        // RGBA image (with alpha) - should still work after conversion
        let img = image::RgbaImage::from_fn(100, 80, |x, y| {
            image::Rgba([(x % 256) as u8, (y % 256) as u8, 128, 200])
        });
        let tmp = std::env::temp_dir().join("editormd_test_pdf_rgba.png");
        img.save(&tmp).unwrap();
        
        let result = load_image_for_pdf(&tmp);
        std::fs::remove_file(&tmp).ok();
        assert!(result.is_some(), "RGBA PNG should load for PDF (alpha stripped)");
    }
    
    #[test]
    fn test_load_image_for_pdf_webp() {
        // Create a WebP by encoding a test image
        let img = image::RgbImage::from_fn(100, 80, |x, y| {
            image::Rgb([(x % 256) as u8, (y % 256) as u8, 128])
        });
        let tmp = std::env::temp_dir().join("editormd_test_pdf.webp");
        img.save(&tmp).unwrap();
        
        let result = load_image_for_pdf(&tmp);
        std::fs::remove_file(&tmp).ok();
        assert!(result.is_some(), "WebP should load for PDF");
    }
    
    #[test]
    fn test_load_image_for_docx_png() {
        let img = image::RgbImage::from_fn(100, 80, |_, _| image::Rgb([255, 0, 0]));
        let tmp = std::env::temp_dir().join("editormd_test_docx.png");
        img.save(&tmp).unwrap();
        
        let result = load_image_for_docx(&tmp);
        std::fs::remove_file(&tmp).ok();
        assert!(result.is_some(), "PNG should load for DOCX");
    }
    
    #[test]
    fn test_load_image_for_docx_jpeg() {
        let img = image::RgbImage::from_fn(100, 80, |_, _| image::Rgb([0, 255, 0]));
        let tmp = std::env::temp_dir().join("editormd_test_docx.jpg");
        img.save(&tmp).unwrap();
        
        let result = load_image_for_docx(&tmp);
        std::fs::remove_file(&tmp).ok();
        assert!(result.is_some(), "JPEG should load for DOCX");
    }
    
    #[test]
    fn test_load_image_for_pdf_svg_skipped() {
        // SVG should return None gracefully, not panic
        let tmp = std::env::temp_dir().join("editormd_test.svg");
        std::fs::write(&tmp, "<svg></svg>").unwrap();
        
        let result = load_image_for_pdf(&tmp);
        std::fs::remove_file(&tmp).ok();
        assert!(result.is_none(), "SVG should be skipped for PDF");
    }
}
