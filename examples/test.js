const { PdfToHtmlConverter } = require('../src/index');
const fs = require('fs');
const path = require('path');

/**
 * Test file for the PDF to HTML converter
 */

async function runTests() {
  console.log('Running PDF to HTML Converter Tests\n');

  // Test 1: Converter initialization
  console.log('Test 1: Converter Initialization');
  try {
    const converter = new PdfToHtmlConverter();
    console.log('✓ Converter created successfully');
    console.log('  Default options:', converter.options);
  } catch (error) {
    console.log('✗ Failed to create converter:', error.message);
  }

  // Test 2: Custom options
  console.log('\nTest 2: Custom Options');
  try {
    const converter = new PdfToHtmlConverter({
      includeStyles: false,
      includeImages: false
    });
    console.log('✓ Custom options applied successfully');
    console.log('  Options:', converter.options);
  } catch (error) {
    console.log('✗ Failed to apply options:', error.message);
  }

  // Test 3: HTML escaping
  console.log('\nTest 3: HTML Escaping');
  try {
    const converter = new PdfToHtmlConverter();
    const testString = '<script>alert("test")</script>';
    const escaped = converter.escapeHtml(testString);
    const expected = '&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;';
    
    if (escaped === expected) {
      console.log('✓ HTML escaping works correctly');
      console.log('  Input:', testString);
      console.log('  Output:', escaped);
    } else {
      console.log('✗ HTML escaping failed');
      console.log('  Expected:', expected);
      console.log('  Got:', escaped);
    }
  } catch (error) {
    console.log('✗ HTML escaping test failed:', error.message);
  }

  // Test 4: Table detection logic
  console.log('\nTest 4: Table Detection Logic');
  try {
    const converter = new PdfToHtmlConverter();
    
    // Mock table-like elements
    const tableElements = [
      { text: 'Header1', x: 10, y: 10, width: 50 },
      { text: 'Header2', x: 70, y: 10, width: 50 },
      { text: 'Header3', x: 130, y: 10, width: 50 },
      { text: 'Data1', x: 10, y: 30, width: 50 },
      { text: 'Data2', x: 70, y: 30, width: 50 },
      { text: 'Data3', x: 130, y: 30, width: 50 }
    ];
    
    const tables = converter.detectTables(tableElements);
    console.log('✓ Table detection executed');
    console.log('  Detected tables:', tables.length);
  } catch (error) {
    console.log('✗ Table detection failed:', error.message);
  }

  // Test 5: List detection
  console.log('\nTest 5: List Detection');
  try {
    const converter = new PdfToHtmlConverter();
    
    // Mock list elements
    const listElements = [
      { text: '• First item', x: 10, y: 10 },
      { text: '• Second item', x: 10, y: 30 },
      { text: '• Third item', x: 10, y: 50 }
    ];
    
    const lists = converter.detectLists(listElements);
    console.log('✓ List detection executed');
    console.log('  Detected lists:', lists.length);
  } catch (error) {
    console.log('✗ List detection failed:', error.message);
  }

  // Test 6: PDF conversion (if sample exists)
  console.log('\nTest 6: PDF Conversion');
  const samplePdf = path.join(__dirname, 'sample.pdf');
  
  if (fs.existsSync(samplePdf)) {
    try {
      const converter = new PdfToHtmlConverter();
      const pages = await converter.convertToHtml(samplePdf);
      
      console.log('✓ PDF conversion successful');
      console.log('  Pages converted:', pages.length);
      console.log('  First page dimensions:', `${pages[0].width}x${pages[0].height}`);
    } catch (error) {
      console.log('✗ PDF conversion failed:', error.message);
    }
  } else {
    console.log('⊘ Skipped (no sample.pdf found)');
    console.log('  Add a PDF file at examples/sample.pdf to test conversion');
  }

  console.log('\n=== Test Summary ===');
  console.log('Tests completed. Add a sample PDF to run full conversion tests.');
}

runTests().catch(console.error);
