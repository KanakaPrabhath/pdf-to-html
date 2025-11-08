const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

async function analyzeTableContent() {
  const data = new Uint8Array(fs.readFileSync('examples/sample.pdf'));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const page = await doc.getPage(2);
  const content = await page.getTextContent();
  
  console.log('\n=== All items in table area (y: 680-800) ===');
  const tableItems = content.items.filter(i => i.transform[5] > 680 && i.transform[5] < 800);
  
  tableItems.forEach((item, i) => {
    console.log(`${i}: '${item.str}' at x=${item.transform[4].toFixed(2)}, y=${item.transform[5].toFixed(2)}`);
  });
}

analyzeTableContent().catch(console.error);
