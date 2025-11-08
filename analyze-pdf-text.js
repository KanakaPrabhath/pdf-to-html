const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
const path = require('path');

async function analyzePdfText() {
  const pdfPath = path.join(__dirname, 'examples', 'sample.pdf');
  
  try {
    const loadingTask = pdfjsLib.getDocument(pdfPath);
    const pdfDocument = await loadingTask.promise;
    
    console.log('\n=== Analyzing PDF Text Extraction ===\n');
    
    // Get first page
    const page = await pdfDocument.getPage(1);
    const textContent = await page.getTextContent();
    
    console.log('First 20 text items from page 1:\n');
    
    textContent.items.slice(0, 20).forEach((item, index) => {
      console.log(`Item ${index}:`);
      console.log(`  Font: ${item.fontName}`);
      console.log(`  Text (raw): "${item.str}"`);
      console.log(`  Text (hex): ${Buffer.from(item.str, 'utf8').toString('hex')}`);
      console.log(`  Char codes: ${Array.from(item.str).map(c => c.charCodeAt(0).toString(16).padStart(4, '0')).join(' ')}`);
      console.log('');
    });
    
    // Show what we expect
    console.log('\n=== Expected Text ===');
    const expected = 'හානා හීය පානා අඬහැරෙන් දැනේ';
    console.log(`Text: "${expected}"`);
    console.log(`Char codes: ${Array.from(expected).map(c => c.charCodeAt(0).toString(16).padStart(4, '0')).join(' ')}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

analyzePdfText();
