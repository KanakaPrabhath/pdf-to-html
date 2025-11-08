const { PdfToHtmlConverter } = require('./src/index');
const path = require('path');

async function debugTable() {
  const pdfPath = path.join(__dirname, 'examples', 'sample.pdf');
  const converter = new PdfToHtmlConverter();
  
  // Access the internal PDF processing
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjsLib.getDocument(pdfPath);
  const pdfDocument = await loadingTask.promise;
  
  // Get page 2 (where the table is)
  const page = await pdfDocument.getPage(2);
  const viewport = page.getViewport({ scale: 1.5 });
  const textContent = await page.getTextContent();
  
  // Extract elements
  const elements = converter.elementExtractor.extractElements(textContent, viewport);
  
  // Find elements in the table area (y between 680 and 780)
  const tableAreaElements = elements.filter(el => 
    el.y >= 680 && el.y <= 780
  );
  
  console.log('\n=== Elements in table area (y: 680-780) ===');
  tableAreaElements.forEach((el, idx) => {
    console.log(`${idx}: "${el.text}" at x=${el.x.toFixed(2)}, y=${el.y.toFixed(2)}, width=${el.width.toFixed(2)}, fontSize=${el.fontSize.toFixed(2)}`);
  });
  
  // Group into rows
  const rows = converter.elementExtractor.groupIntoRows(elements);
  console.log('\n=== Rows in page 2 ===');
  rows.forEach((row, idx) => {
    const rowText = row.map(el => el.text).join(' | ');
    const rowY = row[0].y.toFixed(2);
    console.log(`Row ${idx} (y=${rowY}, cols=${row.length}): ${rowText}`);
  });
  
  // Detect lists first
  const lists = converter.listDetector.detectLists(elements);
  console.log('\n=== Detected lists ===');
  console.log(`Found ${lists.length} lists`);
  
  // Merge adjacent elements for better table detection
  const mergedElements = converter.elementExtractor.mergeAdjacentElements(elements, 10);
  console.log('\n=== Merged elements in table area ===');
  const mergedTableArea = mergedElements.filter(el => el.y >= 680 && el.y <= 780);
  mergedTableArea.forEach((el, idx) => {
    console.log(`${idx}: "${el.text}" at x=${el.x.toFixed(2)}, y=${el.y.toFixed(2)}, width=${el.width.toFixed(2)}`);
  });
  
  // Group merged elements into rows
  const mergedRows = converter.elementExtractor.groupIntoRows(mergedElements);
  console.log('\n=== Merged rows in page 2 ===');
  mergedRows.slice(1, 6).forEach((row, idx) => {
    const rowText = row.map(el => el.text).join(' | ');
    const rowY = row[0].y.toFixed(2);
    console.log(`Row ${idx+1} (y=${rowY}, cols=${row.length}): ${rowText}`);
  });
  
  // Detect tables with merged elements
  const tables = converter.tableDetector.detectTables(mergedElements, null, lists);
  console.log('\n=== Detected tables ===');
  console.log(`Found ${tables.length} tables`);
  tables.forEach((table, tIdx) => {
    console.log(`\nTable ${tIdx}:`);
    table.forEach((row, rIdx) => {
      const rowText = row.map(el => el.text).join(' | ');
      console.log(`  Row ${rIdx}: ${rowText}`);
    });
  });
}

debugTable().catch(console.error);
