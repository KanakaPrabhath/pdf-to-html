const fs = require('fs');
const path = require('path');

// Read both files
const wordHtml = fs.readFileSync(path.join(__dirname, 'examples', 'sample-2.htm'), 'utf8');
const pdfHtml = fs.readFileSync(path.join(__dirname, 'examples', 'output', 'complete-document.html'), 'utf8');

// Extract Sinhala text from Word HTML (decode HTML entities)
function decodeHTMLEntities(text) {
    return text.replace(/&#(\d+);/g, (match, dec) => {
        return String.fromCharCode(dec);
    });
}

// Extract just the Sinhala content from body
function extractSinhalaText(html) {
    // Find body content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (!bodyMatch) return '';
    
    const bodyContent = bodyMatch[1];
    
    // Remove scripts, styles, etc.
    let cleaned = bodyContent
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    // Decode HTML entities
    cleaned = decodeHTMLEntities(cleaned);
    
    // Extract only lines with Sinhala characters
    const lines = cleaned.split(/[.!?។]/);
    const sinhalaLines = lines.filter(line => /[\u0D80-\u0DFF]/.test(line));
    
    return sinhalaLines.join('\n').trim();
}

const wordText = extractSinhalaText(wordHtml);
const pdfText = extractSinhalaText(pdfHtml);

console.log('=== WORD HTML (First 2000 chars) ===');
console.log(wordText.substring(0, 2000));
console.log('\n\n=== PDF HTML (First 2000 chars) ===');
console.log(pdfText.substring(0, 2000));

// Find common incorrect patterns
console.log('\n\n=== ANALYSIS ===');

// Check for common spacing issues in PDF version
const pdfWords = pdfText.split(/\s+/).filter(w => /[\u0D80-\u0DFF]/.test(w));
const wordWords = wordText.split(/\s+/).filter(w => /[\u0D80-\u0DFF]/.test(w));

console.log(`\nWord document has ${wordWords.length} Sinhala words`);
console.log(`PDF document has ${pdfWords.length} Sinhala words`);

// Find words that appear in Word but differently in PDF
const incorrectPatterns = {};

// Sample first 100 words
const sampleSize = Math.min(50, wordWords.length, pdfWords.length);
console.log(`\n=== First ${sampleSize} Word Samples ===`);
for (let i = 0; i < sampleSize; i++) {
    if (wordWords[i] && pdfWords[i] && wordWords[i] !== pdfWords[i]) {
        console.log(`WORD: "${wordWords[i]}" -> PDF: "${pdfWords[i]}"`);
        incorrectPatterns[pdfWords[i]] = wordWords[i];
    }
}

console.log('\n\n=== Suggested Corrections ===');
console.log(JSON.stringify(incorrectPatterns, null, 2));
