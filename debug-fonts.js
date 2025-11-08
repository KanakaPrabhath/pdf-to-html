const { convertPdfToHtml } = require('./src/index');
const path = require('path');

async function debugFonts() {
  const pdfPath = path.join(__dirname, 'examples', 'sample.pdf');
  
  try {
    const pages = await convertPdfToHtml(pdfPath);
    
    console.log('\n=== Font Information ===\n');
    
    // We'll need to modify the converter to expose font info
    console.log('Check the HTML output to see if Sinhala characters are displaying correctly');
    console.log('\nIf characters look like: පාඨ, කවි, ජනකවි - then Unicode is working');
    console.log('If you see boxes or question marks, there\'s an encoding issue\n');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugFonts();
