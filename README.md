# PDF to HTML Converter

A powerful Node.js library that converts PDF files to HTML with styles and elements like images, lists, and tables. The library processes PDFs page by page, preserving layout, formatting, and structure.

## Features

- ✅ **Page-by-Page Processing**: Convert PDF documents one page at a time
- ✅ **Style Preservation**: Maintains fonts, sizes, and formatting
- ✅ **Table Detection**: Automatically detects and converts tables to HTML tables
- ✅ **List Recognition**: Identifies and converts bullet points and numbered lists (without duplicate markers)
- ✅ **Image Extraction**: Extracts and embeds images as base64 with proper encoding
- ✅ **Smart Paragraph Detection**: Improved paragraph identification with proper line break handling
- ✅ **Flexible Output**: Get individual pages or a complete HTML document
- ✅ **Modular Architecture**: Organized into specialized modules for easy maintenance and extension
- ✅ **Customizable**: Control which elements to include in conversion

## Installation

```bash
npm install pdf-to-html-converter
```

Or install from the repository:

```bash
git clone https://github.com/KanakaPrabhath/pdf-to-html.git
cd pdf-to-html
npm install
```

## Quick Start

```javascript
const { convertPdfToHtml, convertPdfToSingleHtml } = require('pdf-to-html-converter');

// Convert PDF to array of pages
async function convertPdf() {
  const pages = await convertPdfToHtml('document.pdf');
  
  console.log(`Converted ${pages.length} pages`);
  
  pages.forEach(page => {
    console.log(`Page ${page.pageNumber}: ${page.width}x${page.height}px`);
    console.log(page.html);
  });
}

// Convert to single HTML document
async function convertToSingleDoc() {
  const innerHtml = await convertPdfToSingleHtml('document.pdf');
  // innerHtml contains just the page content without HTML document wrapper
  const completeHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PDF Document</title>
  <style>body { margin: 20px; background: #f0f0f0; }</style>
</head>
<body>
  ${innerHtml}
</body>
</html>`;
  require('fs').writeFileSync('output.html', completeHtml);
}
```

## API Reference

### `convertPdfToHtml(pdfPath, options)`

Converts a PDF file to an array of HTML pages.

**Parameters:**
- `pdfPath` (string|Buffer): Path to PDF file or PDF buffer
- `options` (Object): Conversion options (optional)
  - `includeStyles` (boolean): Include CSS styles (default: true)
  - `includeImages` (boolean): Extract and include images (default: true)
  - `includeTables` (boolean): Detect and convert tables (default: true)
  - `includeLists` (boolean): Detect and convert lists (default: true)
  - `imageFormat` (string): Image format for extraction (default: 'png')

**Returns:** Promise<Array<Page>>

**Page Object:**
```javascript
{
  pageNumber: 1,
  html: '<div class="pdf-page">...</div>',
  styles: 'CSS styles string',
  width: 595.32,
  height: 841.92
}
```

### `convertPdfToSingleHtml(pdfPath, options)`

Converts a PDF file to inner HTML content (without HTML document wrapper).

**Parameters:**
- `pdfPath` (string|Buffer): Path to PDF file or PDF buffer
- `options` (Object): Conversion options (same as above)

**Returns:** Promise<string> - Inner HTML content that can be placed inside `<body>` tags

### `PdfToHtmlConverter` Class

Create a converter instance for more control:

```javascript
const { PdfToHtmlConverter } = require('pdf-to-html-converter');

const converter = new PdfToHtmlConverter({
  includeStyles: true,
  includeImages: true,
  includeTables: true,
  includeLists: true
});

// Convert entire PDF
const pages = await converter.convertToHtml('document.pdf');

// Convert single page
const page = await converter.convertPage(pdfDocument, 1, options);
```

## Usage Examples

### Example 1: Convert with Custom Options

```javascript
const { PdfToHtmlConverter } = require('pdf-to-html-converter');

const converter = new PdfToHtmlConverter({
  includeStyles: true,
  includeImages: false,  // Skip images
  includeTables: true,
  includeLists: true
});

const pages = await converter.convertToHtml('document.pdf');
```

### Example 2: Save Each Page Separately

```javascript
const { convertPdfToHtml } = require('pdf-to-html-converter');
const fs = require('fs');

async function savePages() {
  const pages = await convertPdfToHtml('document.pdf');
  
  pages.forEach(page => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Page ${page.pageNumber}</title>
  <style>${page.styles}</style>
</head>
<body>
  ${page.html}
</body>
</html>`;
    
    fs.writeFileSync(`page-${page.pageNumber}.html`, html);
  });
}
```

### Example 3: Using Inner HTML Content

```javascript
const { convertPdfToSingleHtml } = require('pdf-to-html-converter');

async function convertToInnerHtml() {
  const innerHtml = await convertPdfToSingleHtml('document.pdf');
  // innerHtml contains just the page content without HTML document wrapper
  
  // Wrap it in your own HTML template
  const completeHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My PDF Document</title>
  <style>
    body { margin: 0; padding: 20px; background: #f0f0f0; }
  </style>
</head>
<body>
  ${innerHtml}
</body>
</html>`;
  
  require('fs').writeFileSync('output.html', completeHtml);
}
```

## How It Works

1. **PDF Loading**: Uses `pdfjs-dist` to load and parse PDF documents
2. **Text Extraction**: Extracts text content with positioning and styling information
3. **Element Detection**: Analyzes layout to identify tables, lists, and images
4. **HTML Generation**: Converts PDF elements to semantic HTML
5. **Style Generation**: Creates CSS to preserve original formatting

## Supported Elements

### Tables
- Automatically detects aligned columns
- Converts to HTML `<table>` elements
- Preserves headers and cell content

### Lists
- Detects bullet points (•, -, *, etc.)
- Detects numbered lists (1., 2., etc.)
- Converts to `<ul>` and `<ol>` elements

### Images
- Extracts embedded images
- Supports PNG and JPEG formats
- Maintains original positioning

### Text
- Preserves font sizes and families
- Maintains absolute positioning
- Handles multiple languages

## Requirements

- Node.js >= 14.0.0
- Dependencies:
  - `pdfjs-dist`: PDF parsing and rendering
  - `canvas`: Image data manipulation and base64 conversion

## Testing

Run the test suite:

```bash
npm test
```

Run the example:

```bash
npm run example
```

## Project Structure

```
pdf-to-html/
├── src/
│   ├── index.js                      # Main entry point
│   ├── PdfToHtmlConverter.js         # Main orchestrator
│   ├── extractors/                   # Element extraction modules
│   │   ├── ElementExtractor.js       # Text extraction
│   │   └── ImageExtractor.js         # Image extraction with base64
│   ├── detectors/                    # Structure detection modules
│   │   ├── TableDetector.js          # Table detection
│   │   └── ListDetector.js           # List detection
│   └── generators/                   # HTML generation modules
│       └── HtmlGenerator.js          # HTML/CSS generation
├── examples/
│   ├── basic-usage.js                # Usage examples
│   └── test.js                       # Test file
├── ARCHITECTURE.md                   # Detailed architecture documentation
├── package.json
├── LICENSE
└── README.md
```

**See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed module documentation.**

## Limitations

- Complex PDF layouts may require manual adjustment
- Some advanced PDF features (forms, annotations) are not fully supported
- Image quality depends on original PDF resolution
- Very large PDFs may require significant memory

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

KanakaPrabhath

## Acknowledgments

- Built with [PDF.js](https://mozilla.github.io/pdf.js/) by Mozilla
- Inspired by the need for accurate PDF to HTML conversion

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/KanakaPrabhath/pdf-to-html).
