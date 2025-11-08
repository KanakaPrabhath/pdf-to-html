const { PdfToHtmlConverter } = require('../src/index');
const path = require('path');
const fs = require('fs');

/**
 * Debug script to check font names in PDF
 */
async function debugFonts() {
  console.log('Font Debug Tool\n');
  
  const pdfPath = path.join(__dirname, 'sample.pdf');
  
  if (!fs.existsSync(pdfPath)) {
    console.log('Error: sample.pdf not found');
    return;
  }
  
  // Create converter with debug mode
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjsLib.getDocument(pdfPath);
  const pdfDocument = await loadingTask.promise;
  
  console.log(`PDF has ${pdfDocument.numPages} pages\n`);
  
  // Check first page
  const page = await pdfDocument.getPage(1);
  const textContent = await page.getTextContent();
  
  // Collect unique fonts
  const fonts = new Set();
  const fontSamples = {};
  
  textContent.items.forEach((item, index) => {
    const fontName = item.fontName;
    fonts.add(fontName);
    
    // Store sample text for each font
    if (!fontSamples[fontName]) {
      fontSamples[fontName] = [];
    }
    if (fontSamples[fontName].length < 5) {
      fontSamples[fontName].push({
        text: item.str,
        chars: Array.from(item.str).map(c => `U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`).join(' ')
      });
    }
  });
  
  console.log('Fonts detected in PDF:');
  console.log('======================\n');
  
  fonts.forEach(fontName => {
    console.log(`Font: ${fontName}`);
    console.log('Sample text:');
    fontSamples[fontName].forEach((sample, i) => {
      console.log(`  ${i + 1}. "${sample.text}"`);
      console.log(`     Codes: ${sample.chars}`);
    });
    console.log('');
  });
}

debugFonts().catch(console.error);
