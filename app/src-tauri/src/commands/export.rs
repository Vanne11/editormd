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

    render_markdown_to_pdf(&mut doc, &markdown, &vault_path);

    ensure_parent(&dest_path)?;
    doc.render_to_file(&dest_path)
        .map_err(|e| format!("Error al generar PDF: {}", e))
}

#[tauri::command]
pub fn export_as_docx(
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

    let docx = render_markdown_to_docx(&markdown, &vault_path);

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

fn render_markdown_to_pdf(doc: &mut genpdf::Document, markdown: &str, vault_path: &str) {
    use genpdf::elements;
    use genpdf::style;
    use genpdf::Element as _;

    let parser = Parser::new_ext(markdown, super::convert::md_options());

    let mut bold = false;
    let mut italic = false;
    let mut heading_level: Option<u8> = None;
    let mut in_code_block = false;
    let mut in_image = false;
    let mut code_block_text = String::new();
    let mut current_paragraph_parts: Vec<(String, style::Style)> = Vec::new();
    let mut list_ordered = false;
    let mut list_item_idx = 0u32;

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
            Event::Start(Tag::CodeBlock(_)) => {
                flush_paragraph(doc, &mut current_paragraph_parts);
                in_code_block = true;
                code_block_text.clear();
            }
            Event::End(TagEnd::CodeBlock) => {
                in_code_block = false;
                doc.push(
                    elements::Paragraph::new(&code_block_text)
                        .styled(style::Style::new().with_font_size(9)),
                );
                doc.push(elements::Break::new(0.3));
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
                if let Some(img_path) =
                    super::convert::resolve_image_path(&dest_url, vault_path)
                {
                    // Intentar cargar directamente, si falla (alpha/formato)
                    // convertir a RGB JPEG primero
                    let img_result = elements::Image::from_path(&img_path)
                        .or_else(|_| {
                            load_image_as_rgb_jpeg(&img_path)
                        });
                    if let Ok(img) = img_result {
                        doc.push(img.with_alignment(genpdf::Alignment::Center));
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

fn render_markdown_to_docx(markdown: &str, vault_path: &str) -> docx_rs::Docx {
    use docx_rs::*;

    let parser = Parser::new_ext(markdown, super::convert::md_options());

    let mut docx = Docx::new();
    let mut bold = false;
    let mut italic = false;
    let mut strikethrough = false;
    let mut in_image = false;
    let mut heading_level: Option<u8> = None;
    let mut in_code_block = false;
    let mut code_block_text = String::new();
    let mut current_runs: Vec<Run> = Vec::new();
    let mut list_ordered = false;
    let mut list_item_idx = 0u32;

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
            Event::Start(Tag::CodeBlock(_)) => {
                flush_docx_paragraph(&mut docx, &mut current_runs, None);
                in_code_block = true;
                code_block_text.clear();
            }
            Event::End(TagEnd::CodeBlock) => {
                in_code_block = false;
                // Agregar bloque de código como párrafo con fuente monospace
                for line in code_block_text.lines() {
                    let run = Run::new()
                        .add_text(line)
                        .size(18) // 9pt (half-points)
                        .fonts(RunFonts::new().ascii("Courier New"));
                    docx = docx.add_paragraph(Paragraph::new().add_run(run));
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
                if let Some(img_path) =
                    super::convert::resolve_image_path(&dest_url, vault_path)
                {
                    if let Ok(data) = std::fs::read(&img_path) {
                        let pic = Pic::new(&data);
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

/// Carga una imagen y la convierte a RGB JPEG sin alpha para genpdf
fn load_image_as_rgb_jpeg(path: &Path) -> Result<genpdf::elements::Image, genpdf::error::Error> {
    let data = fs::read(path).map_err(|e| {
        genpdf::error::Error::new(
            format!("Cannot read image: {}", e),
            genpdf::error::ErrorKind::InvalidData,
        )
    })?;
    let img = image::load_from_memory(&data).map_err(|e| {
        genpdf::error::Error::new(
            format!("Cannot decode image: {}", e),
            genpdf::error::ErrorKind::InvalidData,
        )
    })?;
    // Convertir a RGB (quita alpha)
    let rgb = image::DynamicImage::ImageRgb8(img.to_rgb8());
    genpdf::elements::Image::from_dynamic_image(rgb)
}
