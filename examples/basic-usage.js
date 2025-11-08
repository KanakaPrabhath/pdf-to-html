const { convertPdfToHtml, convertPdfToSingleHtml, PdfToHtmlConverter } = require('../src/index');
const fs = require('fs');
const path = require('path');

/**
 * Basic usage example for the PDF to HTML converter
 */

async function main() {
  console.log('PDF to HTML Converter - Basic Usage Example\n');

  // Example 1: Convert PDF to array of pages
  console.log('Example 1: Converting PDF to HTML pages...');
  try {
    const pdfPath = path.join(__dirname, 'sample.pdf');
    
    // Check if sample PDF exists
    if (!fs.existsSync(pdfPath)) {
      console.log('Note: sample.pdf not found. Please add a PDF file to the examples folder.');
      console.log('Creating a placeholder for demonstration...\n');
    }

    // Create converter instance
    const converter = new PdfToHtmlConverter({
      includeStyles: true,
      includeImages: true,
      includeTables: true,
      includeLists: true
    });

  } catch (error) {
    console.error('Error:', error.message);
  }

  // Example 2: Convert to single HTML document
  console.log('\nExample 2: Converting PDF to single HTML document...');
  try {
    const pdfPath = path.join(__dirname, 'sample.pdf');

    if (fs.existsSync(pdfPath)) {
      const startTime = Date.now();
      const innerHtml = await convertPdfToSingleHtml(pdfPath);
      const endTime = Date.now();

      // Count pages by counting page breaks
      const pageBreaks = (innerHtml.match(/data-page-number/g) || []).length;
      const totalPages = pageBreaks + 1; // +1 for the first page
      
      console.log(`✓ Converted ${totalPages} pages in ${((endTime - startTime) / 1000).toFixed(2)}s`);

      // Create output directory if it doesn't exist
      const outputDir = path.join(__dirname, 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Wrap the inner HTML content in a complete HTML document
      // Added lang="si" for Sinhala and proper font stack for Sinhala rendering
      const completeHtml = `<!DOCTYPE html>
<html lang="si">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PDF to HTML Conversion</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #f0f0f0;
      font-family: 'Noto Sans Sinhala', 'Iskoola Pota', 'FM Abhaya', Arial, sans-serif;
    }
  </style>
</head>
<body>
  ${innerHtml}
</body>
</html>`;

      const outputPath = path.join(outputDir, 'complete-document.html');
      // Explicitly write with UTF-8 encoding
      fs.writeFileSync(outputPath, completeHtml, 'utf8');
      console.log(`✓ Saved complete document to ${outputPath}`);
      console.log(`✓ File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
    } else {
      console.log('Add a sample.pdf file to try this example.');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }

  // Example 3: Using custom options
  console.log('\nExample 3: Custom conversion options...');
  const customConverter = new PdfToHtmlConverter({
    includeStyles: true,
    includeImages: false,  // Disable images
    includeTables: true,
    includeLists: true,
    imageFormat: 'jpeg'
  });

  console.log('Converter initialized with custom options:');
  console.log('- Styles: enabled');
  console.log('- Images: disabled');
  console.log('- Tables: enabled');
  console.log('- Lists: enabled');

  console.log('\n=== Setup Instructions ===');
  console.log('1. Run: npm install');
  console.log('2. Add a sample PDF file to examples/sample.pdf');
  console.log('3. Run: npm run example');
  console.log('4. Check the examples/output/ folder for converted HTML files');
}

main().catch(console.error);
