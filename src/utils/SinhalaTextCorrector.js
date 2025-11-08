const fs = require('fs');
const path = require('path');

/**
 * Sinhala Text Corrector
 * Fixes common issues in Sinhala text extracted from PDFs
 */
class SinhalaTextCorrector {
  constructor() {
    // Load corrections from JSON file
    this.loadCorrections();
  }

  /**
   * Load corrections from JSON file
   */
  loadCorrections() {
    try {
      const correctionsPath = path.join(__dirname, 'sinhala-corrections.json');
      const data = fs.readFileSync(correctionsPath, 'utf8');
      this.corrections = JSON.parse(data).corrections;
    } catch (error) {
      console.warn('Warning: Could not load Sinhala corrections file:', error.message);
      this.corrections = { words: {}, patterns: {} };
    }
  }

  /**
   * Clean and correct Sinhala text
   * @param {string} text - Text to correct
   * @returns {string} Corrected text
   */
  correctText(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let corrected = text;

    // First normalize Unicode to ensure consistency
    corrected = corrected.normalize('NFC');

    // Apply word corrections (specific fixes) - these are complete word replacements
    corrected = this.applyCorrections(corrected, this.corrections.words);

    // Apply pattern corrections (for spacing issues, combining marks, etc.)
    corrected = this.applyCorrections(corrected, this.corrections.patterns);

    // Additional cleanup for common Sinhala PDF extraction issues
    corrected = this.cleanupSinhalaText(corrected);

    // Final normalization
    corrected = corrected.normalize('NFC');

    return corrected;
  }

  /**
   * Additional cleanup for common Sinhala PDF extraction issues
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   */
  cleanupSinhalaText(text) {
    let cleaned = text;

    // Fix specific common patterns with multiple spaces
    // Pattern: ප්‍ ර X (where X is any Sinhala character) -> ප්‍රX
    cleaned = cleaned.replace(/ප්‍\s+ර\s+([අ-ෆ])/g, 'ප්‍ර$1');
    
    // Pattern: ප්‍ X where X is a character that should be attached
    cleaned = cleaned.replace(/ප්‍\s+([තදමශ])/g, 'ප්‍$1');
    
    // Fix spacing around combining marks (vowel signs, etc.)
    // Sinhala vowel signs: 0DCA-0DDF
    cleaned = cleaned.replace(/\s+([\u0DCA-\u0DDF])/g, '$1');
    
    // Fix spacing before virama (hal kirima) and ra-karanshaya
    cleaned = cleaned.replace(/([අ-ෆ])\s+(්)/g, '$1$2');
    cleaned = cleaned.replace(/([අ-ෆ])\s+(්‍ර)/g, '$1$2');
    
    // Remove excessive spaces
    cleaned = cleaned.replace(/\s{2,}/g, ' ');

    return cleaned;
  }

  /**
   * Apply a set of corrections to text
   * @param {string} text - Text to correct
   * @param {Object} corrections - Correction mappings
   * @returns {string} Corrected text
   */
  applyCorrections(text, corrections) {
    if (!corrections) return text;
    
    let result = text;
    for (const [wrong, correct] of Object.entries(corrections)) {
      // Escape special regex characters in the wrong text
      const escapedWrong = wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Use global flag to replace all occurrences
      const regex = new RegExp(escapedWrong, 'g');
      result = result.replace(regex, correct);
    }
    return result;
  }

  /**
   * Reload corrections from file (useful for updating without restarting)
   */
  reloadCorrections() {
    this.loadCorrections();
  }

  /**
   * Check if text contains Sinhala characters
   * @param {string} text - Text to check
   * @returns {boolean} True if contains Sinhala
   */
  containsSinhala(text) {
    // Sinhala Unicode range: 0D80-0DFF
    return /[\u0D80-\u0DFF]/.test(text);
  }
}

module.exports = SinhalaTextCorrector;
