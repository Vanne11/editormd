use pulldown_cmark::{html, Options, Parser};

/// Convierte markdown a HTML standalone
pub fn markdown_to_html(markdown: &str, title: &str) -> String {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);

    let parser = Parser::new_ext(markdown, options);
    let mut body = String::new();
    html::push_html(&mut body, parser);

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
    blockquote {{ border-left: 4px solid #ddd; margin-left: 0; padding-left: 1rem; color: #555; }}
    img {{ max-width: 100%; }}
    table {{ border-collapse: collapse; width: 100%; }}
    th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
    th {{ background: #f4f4f4; }}
  </style>
</head>
<body>
{}
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

fn escape_html(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}
