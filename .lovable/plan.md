# Print-Ready Business Card — Arsalan Manesh (NEVO INDUSTRIAL)

Produce real, printer-ready two-sided business card files matching the /connect digital card branding.

## Specification

- Trim size: 85 × 55 mm (UAE/EU standard)
- Bleed: 3 mm on all sides → artboard 91 × 61 mm
- Safety margin: 4 mm inside trim
- Resolution: 300 DPI for raster previews; vector text in the PDF
- Two sides: front and back, each as its own page plus separate single-side files

## Design

Front (black background, NEVO brand):
- NEVO logo (existing `nevo-logo-light.png`), centered upper area
- Name: Arsalan Manesh
- Title: International Business Director
- Thin green accent rule (brand accent green used on /connect)

Back (white background):
- Company: NEVO Trading and Consultancy L.L.C – FZ
- Mobile / WhatsApp: +971 50 242 6167
- Email: arsalan@nevoindustrial.com
- Website: nevoindustrial.com
- Address: Meydan Freezone, Dubai, UAE
- QR code (high error-correction) pointing to https://www.nevoindustrial.com/connect, with a small "Digital card" caption
- Small green accent element for brand continuity

## Deliverables (written to the documents area, downloadable)

- `nevo-business-card-arsalan-85x55-print.pdf` — 2 pages (front, back) with bleed and crop marks
- `nevo-business-card-arsalan-front.pdf` and `...-back.pdf` — single-side files for printers that require them
- `nevo-business-card-arsalan-front.png` and `...-back.png` — 300 DPI previews for review/sharing
- A short specs note (size, bleed, fonts, colors) so the print shop has everything

## Technical approach

- Python script in `/tmp` using ReportLab for the PDF (vector text, exact mm geometry, crop marks) and `qrcode` + Pillow for the QR and PNG previews.
- QR generated at print resolution (error correction M/H, quiet zone preserved) and embedded as a high-DPI image.
- Fonts: register a Unicode TTF (DejaVu family) so no glyph boxes appear; fall back gracefully if a brand font is not available in the sandbox.
- Colors sourced from the site tokens used on /connect (black, white, brand green) and converted to explicit values in the PDF.
- QA: render every PDF page to images at 150–300 DPI and inspect for clipped text, safety-margin violations, QR quiet zone, and logo cropping; fix and re-render until clean.

No application source files change — this is an asset-generation task only.
