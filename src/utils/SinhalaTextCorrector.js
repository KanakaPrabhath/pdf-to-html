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

    // Apply word corrections
    corrected = this.applyCorrections(corrected, this.corrections.words);

    // Apply pattern corrections (for spacing issues, etc.)
    corrected = this.applyCorrections(corrected, this.corrections.patterns);

    // Normalize Unicode
    corrected = corrected.normalize('NFC');

    return corrected;
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
      result = result.replace(new RegExp(escapedWrong, 'g'), correct);
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
