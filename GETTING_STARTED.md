# Getting Started with PDF to HTML Converter

This guide will help you get started with the PDF to HTML converter library.

## Installation

1. **Clone or download the repository**
   ```bash
   git clone https://github.com/KanakaPrabhath/pdf-to-html.git
   cd pdf-to-html
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Verify installation**
   ```bash
   npm test
   ```

## Quick Start

### Method 1: Using a Test PDF

1. Add any PDF file to the `examples` folder and name it `sample.pdf`

2. Run the example:
   ```bash
   npm run example
   ```

3. Check the `examples/output` folder for the generated HTML files

### Method 2: Using the Library in Your Code

Create a new file `my-converter.js`:

```javascript
const { convertPdfToHtml } = require('./src/index');
const fs = require('fs');

async function convert() {
  // Convert PDF to pages
  const pages = await convertPdfToHtml('path/to/your/file.pdf');
  
  // Process each page
  pages.forEach((page, index) => {
    console.log(`Page ${page.pageNumber}:`);
    console.log(`  Size: ${page.width}x${page.height}px`);
    
    // Save as individual HTML file
    const html = `<!DOCTYPE html>
<html>
<head>
  <style>${page.styles}</style>
</head>
<body>
  ${page.html}
</body>
</html>`;
    
    fs.writeFileSync(`output-page-${page.pageNumber}.html`, html);
  });
}

convert().catch(console.error);
```

## API Examples

### 1. Convert to Individual Pages

```javascript
const { convertPdfToHtml } = require('./src/index');

async function convertPages() {
  const pages = await convertPdfToHtml('document.pdf', {
    includeStyles: true,
    includeImages: true,
    includeTables: true,
    includeLists: true
  });
  
  return pages; // Array of page objects
}
```

### 2. Convert to Single Document

```javascript
const { convertPdfToSingleHtml } = require('./src/index');

async function convertDocument() {
  const html = await convertPdfToSingleHtml('document.pdf');
  require('fs').writeFileSync('output.html', html);
}
```

### 3. Custom Processing

```javascript
const { PdfToHtmlConverter } = require('./src/index');

async function customConvert() {
  const converter = new PdfToHtmlConverter({
    includeStyles: true,
    includeImages: false, // Skip images
    includeTables: true,
    includeLists: true
  });
  
  const pages = await converter.convertToHtml('document.pdf');
  
  // Custom processing for each page
  for (const page of pages) {
    console.log(`Processing page ${page.pageNumber}...`);
    // Your custom logic here
  }
}
```

### 4. Using with PDF Buffers

```javascript
const { convertPdfToHtml } = require('./src/index');
const fs = require('fs');

async function convertBuffer() {
  const pdfBuffer = fs.readFileSync('document.pdf');
  const pages = await convertPdfToHtml(pdfBuffer);
  
  console.log(`Converted ${pages.length} pages from buffer`);
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeStyles` | boolean | `true` | Include CSS styles in output |
| `includeImages` | boolean | `true` | Extract and include images |
| `includeTables` | boolean | `true` | Detect and convert tables |
| `includeLists` | boolean | `true` | Detect and convert lists |
| `imageFormat` | string | `'png'` | Format for extracted images |

## Output Structure

### Page Object

```javascript
{
  pageNumber: 1,              // Page number (1-indexed)
  html: '<div>...</div>',     // HTML content
  styles: 'CSS rules...',     // CSS styles
  width: 595.32,              // Page width in pixels
  height: 841.92              // Page height in pixels
}
```

## Testing Your Conversion

1. **Run basic tests:**
   ```bash
   npm test
   ```

2. **Test with your PDF:**
   - Copy your PDF to `examples/sample.pdf`
   - Run: `npm run example`
   - Check: `examples/output/` folder

3. **Create a test PDF:**
   - Install pdfkit: `npm install pdfkit`
   - Run: `npm run create-sample`
   - Test file will be created at `examples/sample.pdf`

## Troubleshooting

### Issue: "Cannot find module" error

**Solution:** Make sure you've run `npm install` in the project directory.

### Issue: PDF conversion fails

**Solution:** 
1. Verify the PDF file is not corrupted
2. Check the PDF file path is correct
3. Ensure the PDF is not password-protected

### Issue: Missing text or formatting

**Solution:** Some complex PDFs may require manual adjustment. The library works best with standard text-based PDFs.

## Advanced Usage

### Processing Large PDFs

```javascript
const { PdfToHtmlConverter } = require('./src/index');

async function processLargePdf() {
  const converter = new PdfToHtmlConverter();
  
  // Process pages one at a time to save memory
  const pdfPath = 'large-document.pdf';
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
  const doc = await pdfjsLib.getDocument(pdfPath).promise;
  
  for (let i = 1; i <= doc.numPages; i++) {
    const pageData = await converter.convertPage(doc, i, converter.options);
    console.log(`Processed page ${i}/${doc.numPages}`);
    
    // Process or save page immediately
    // This prevents memory buildup
  }
}
```

### Custom Styling

```javascript
const { convertPdfToSingleHtml } = require('./src/index');
const fs = require('fs');

async function convertWithCustomStyles() {
  let html = await convertPdfToSingleHtml('document.pdf');
  
  // Add custom CSS
  const customStyles = `
    <style>
      .pdf-page { 
        border: 2px solid #333; 
        margin: 40px auto;
      }
      .pdf-table { 
        background: #f5f5f5; 
      }
    </style>
  `;
  
  html = html.replace('</head>', `${customStyles}</head>`);
  fs.writeFileSync('styled-output.html', html);
}
```

## Next Steps

- Check out the examples in the `examples/` folder
- Read the full API documentation in `README.md`
- Experiment with different PDFs and options
- Contribute improvements to the project!

## Support

For issues or questions:
- Check the [README.md](README.md) for documentation
- Review examples in the `examples/` folder
- Visit the GitHub repository for updates
