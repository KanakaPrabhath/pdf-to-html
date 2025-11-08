/**
 * Sinhala Font Mapper
 * Handles font encoding issues with Sinhala PDFs
 */
class SinhalaFontMapper {
  constructor() {
    // Common Sinhala font mappings (FM-Abhaya, FM-Malithi, etc.)
    // These fonts often use non-standard encodings
    this.fontMappings = this.initializeMappings();
  }

  /**
   * Initialize font character mappings
   * @returns {Object} Font mapping tables
   */
  initializeMappings() {
    return {
      // FM-Abhaya and similar fonts mapping
      'FM-Abhaya': this.getFMAbhayaMapping(),
      'FM-Malithi': this.getFMMalithiMapping(),
      // Add more font mappings as needed
    };
  }

  /**
   * Get FM-Abhaya font character mapping
   * Maps from font-specific codes to proper Unicode
   * @returns {Object} Character mapping table
   */
  getFMAbhayaMapping() {
    // This is a sample mapping - you'll need to expand this based on actual font encoding
    return {
      // Vowels
      '\u0061': '\u0D85', // අ
      '\u0041': '\u0D86', // ආ
      '\u0069': '\u0D89', // ඉ
      '\u0049': '\u0D8A', // ඊ
      '\u0075': '\u0D8B', // උ
      '\u0055': '\u0D8C', // ඌ
      '\u0045': '\u0D91', // එ
      '\u0065': '\u0D92', // ඒ
      '\u004F': '\u0D94', // ඔ
      '\u006F': '\u0D95', // ඕ
      
      // Consonants - sample mapping
      '\u006B': '\u0D9A', // ක
      '\u004B': '\u0D9B', // ඛ
      '\u0067': '\u0D9C', // ග
      '\u0047': '\u0D9D', // ඝ
      '\u0070': '\u0DB4', // ප
      '\u0050': '\u0DB5', // ඵ
      '\u0062': '\u0DB6', // බ
      '\u0042': '\u0DB7', // භ
      '\u006D': '\u0DB8', // ම
      '\u0079': '\u0DBA', // ය
      '\u0072': '\u0DBB', // ර
      '\u006C': '\u0DBD', // ල
      '\u0077': '\u0DC0', // ව
      '\u0073': '\u0DC3', // ස
      '\u0068': '\u0DC4', // හ
      '\u006E': '\u0DB1', // න
      
      // Vowel signs (pili)
      '\u0027': '\u0DCF', // ා
      '\u0069': '\u0DD2', // ි
      '\u0049': '\u0DD3', // ී
      '\u0075': '\u0DD4', // ු
      '\u0055': '\u0DD6', // ූ
      '\u0065': '\u0DD9', // ෙ
      '\u0045': '\u0DDA', // ේ
      '\u006F': '\u0DDE', // ො
      '\u004F': '\u0DDF', // ෝ
    };
  }

  /**
   * Get FM-Malithi font character mapping
   * @returns {Object} Character mapping table
   */
  getFMMalithiMapping() {
    // Similar to FM-Abhaya but may have different mappings
    return this.getFMAbhayaMapping(); // Placeholder
  }

  /**
   * Detect if text needs font mapping
   * @param {string} text - Text to check
   * @param {string} fontName - Font name from PDF
   * @returns {boolean} True if mapping needed
   */
  needsMapping(text, fontName) {
    if (!fontName) return false;
    
    // Check if font is in our mapping list
    const fontKey = Object.keys(this.fontMappings).find(key => 
      fontName.includes(key)
    );
    
    return !!fontKey;
  }

  /**
   * Map text from font encoding to proper Unicode
   * @param {string} text - Text to map
   * @param {string} fontName - Font name from PDF
   * @returns {string} Properly mapped Unicode text
   */
  mapText(text, fontName) {
    if (!text || !this.needsMapping(text, fontName)) {
      return text;
    }

    // Find the appropriate mapping table
    const fontKey = Object.keys(this.fontMappings).find(key => 
      fontName.includes(key)
    );

    if (!fontKey) {
      return text;
    }

    const mapping = this.fontMappings[fontKey];
    let mappedText = '';

    // Map each character
    for (let char of text) {
      mappedText += mapping[char] || char;
    }

    // Normalize to NFC form
    return mappedText.normalize('NFC');
  }

  /**
   * Auto-detect and map Sinhala text
   * Tries to detect if text is using custom encoding
   * @param {string} text - Text to check and map
   * @param {string} fontName - Font name from PDF
   * @returns {string} Mapped text
   */
  autoMap(text, fontName) {
    // First try direct mapping if font is known
    if (this.needsMapping(text, fontName)) {
      return this.mapText(text, fontName);
    }

    // Check if text contains ASCII where Sinhala should be
    // If we see ASCII letters but font name suggests Sinhala font
    if (fontName && /sinhala|abhaya|malithi|fm-/i.test(fontName)) {
      // Try FM-Abhaya mapping as default
      return this.mapText(text, 'FM-Abhaya');
    }

    // Return normalized text
    return text.normalize('NFC');
  }
}

module.exports = SinhalaFontMapper;
