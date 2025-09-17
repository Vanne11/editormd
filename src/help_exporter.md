# PDF con ReportLab (A4)
python md_exporter.py tu.md --to pdf

# PDF con fuente incrustada (TTF)
python md_exporter.py tu.md --to pdf --ttf-path "/ruta/a/EBGaramond-Regular.ttf" --font-family "EBGaramond"

# DOCX con tipografía/tamaño
python md_exporter.py tu.md --to docx --font-family "EB Garamond" --font-size 13

# PPTX (H1 = nueva slide, H2/H3 = bullets)
python md_exporter.py tu.md --to pptx

# Mermaid en PNG (compatibilidad)
python md_exporter.py tu.md --to pdf --mermaid-png
