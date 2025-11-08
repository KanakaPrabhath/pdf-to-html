/**
 * HTML Generator
 * Generates HTML from PDF elements
 */
class HtmlGenerator {
  /**
   * Generate HTML from extracted elements
   * @param {Array} elements - Text elements
   * @param {Array} images - Image elements
   * @param {Array} tables - Detected tables
   * @param {Array} lists - Detected lists
   * @param {Object} viewport - PDF viewport
   * @returns {string} Generated HTML
   */
  generateHtml(elements, images, tables, lists, viewport) {
    let html = '';
    
    const processedElements = new Set();
    
    // Mark elements used in tables and lists
    tables.forEach(table => {
      table.forEach(row => row.forEach(el => processedElements.add(el)));
    });
    lists.forEach(list => {
      list.forEach(el => processedElements.add(el));
    });
    
    // Group remaining text elements into semantic blocks
    const blocks = this.groupIntoSemanticBlocks(elements, processedElements);
    
    // Generate semantic HTML for blocks
    blocks.forEach(block => {
      if (block.type === 'header') {
        const level = this.getHeaderLevel(block.fontSize);
        html += `<h${level}>${this.escapeHtml(block.text)}</h${level}>\n`;
      } else if (block.type === 'paragraph') {
        html += `<p>${this.escapeHtml(block.text)}</p>\n`;
      }
    });
    
    // Add tables
    tables.forEach((table, tableIndex) => {
      html += this.generateTableHtml(table, tableIndex);
    });
    
    // Add lists
    lists.forEach((list, listIndex) => {
      html += this.generateListHtml(list, listIndex);
    });
    
    // Add images with base64 data
    images.forEach((image, imageIndex) => {
      html += this.generateImageHtml(image, imageIndex);
    });
    
    return html;
  }

  /**
   * Group text elements into semantic blocks with improved paragraph detection
   * @param {Array} elements - Text elements
   * @param {Set} processedElements - Already processed elements
   * @returns {Array} Array of semantic blocks
   */
  groupIntoSemanticBlocks(elements, processedElements) {
    const blocks = [];
    const sortedElements = [...elements]
      .filter(el => !processedElements.has(el) && el.text.trim())
      .sort((a, b) => {
        if (Math.abs(a.y - b.y) < 5) return a.x - b.x;
        return a.y - b.y;
      });
    
    let currentBlock = null;
    let lastElement = null;
    
    for (const element of sortedElements) {
      const isHeader = element.fontSize > 14;
      const blockType = isHeader ? 'header' : 'paragraph';
      
      // Determine if we should continue the current block or start a new one
      let shouldContinue = false;
      
      if (currentBlock && lastElement) {
        const verticalGap = Math.abs(element.y - lastElement.y);
        const horizontalGap = element.x - (lastElement.x + lastElement.width);
        const fontSizeDiff = Math.abs(element.fontSize - currentBlock.fontSize);
        
        // Same line (within 5px vertically)
        const isSameLine = verticalGap < 5;
        
        // Next line in same paragraph (reasonable vertical gap, similar font size)
        const isNextLineInParagraph = verticalGap > 5 && verticalGap < 25 && 
                                      fontSizeDiff < 2 && 
                                      blockType === currentBlock.type &&
                                      !isHeader;
        
        // Check if element has end-of-line marker
        const hasEOL = lastElement.hasEOL;
        
        shouldContinue = (isSameLine || (isNextLineInParagraph && !hasEOL)) && 
                        blockType === currentBlock.type &&
                        fontSizeDiff < 2;
      }
      
      if (shouldContinue) {
        // Continue current block
        const separator = Math.abs(element.y - lastElement.y) < 5 ? ' ' : '\n';
        currentBlock.text += separator + element.text;
      } else {
        // Save current block and start new one
        if (currentBlock && currentBlock.text.trim()) {
          blocks.push(currentBlock);
        }
        
        currentBlock = {
          type: blockType,
          text: element.text,
          fontSize: element.fontSize,
          y: element.y,
          x: element.x
        };
      }
      
      lastElement = element;
    }
    
    // Add last block
    if (currentBlock && currentBlock.text.trim()) {
      blocks.push(currentBlock);
    }
    
    return blocks;
  }

  /**
   * Determine header level based on font size
   * @param {number} fontSize - Font size
   * @returns {number} Header level (1-6)
   */
  getHeaderLevel(fontSize) {
    if (fontSize >= 24) return 1;
    if (fontSize >= 20) return 2;
    if (fontSize >= 18) return 3;
    if (fontSize >= 16) return 4;
    if (fontSize >= 14) return 5;
    return 6;
  }

  /**
   * Generate HTML table
   * @param {Array} table - Table rows
   * @param {number} tableIndex - Table index
   * @returns {string} HTML table
   */
  generateTableHtml(table, tableIndex) {
    if (!table || table.length === 0) return '';
    
    let html = `<table style="border-collapse: collapse; background: white; border: 1px solid #ddd; margin: 20px 0; width: 100%;">\n`;
    
    table.forEach((row, rowIndex) => {
      html += '  <tr>\n';
      row.forEach(cell => {
        const tag = rowIndex === 0 ? 'th' : 'td';
        const style = rowIndex === 0 
          ? 'border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2; font-weight: bold;'
          : 'border: 1px solid #ddd; padding: 8px; text-align: left;';
        html += `    <${tag} style="${style}">${this.escapeHtml(cell.text)}</${tag}>\n`;
      });
      html += '  </tr>\n';
    });
    
    html += '</table>\n';
    return html;
  }

  /**
   * Generate HTML list without duplicate markers
   * @param {Array} list - List items
   * @param {number} listIndex - List index
   * @returns {string} HTML list
   */
  generateListHtml(list, listIndex) {
    if (!list || list.length === 0) return '';
    
    // Determine list type from first item's original text
    const firstItem = list[0];
    const isOrdered = /^\d+[\.\)]/.test(firstItem.originalText || firstItem.text);
    const tag = isOrdered ? 'ol' : 'ul';
    
    let html = `<${tag} style="margin: 10px 0; padding-left: 20px;">\n`;
    
    list.forEach(item => {
      // Use cleaned text (markers already removed by ListDetector)
      html += `  <li style="margin: 5px 0;">${this.escapeHtml(item.text)}</li>\n`;
    });
    
    html += `</${tag}>\n`;
    return html;
  }

  /**
   * Generate HTML image with base64 data
   * @param {Object} image - Image object
   * @param {number} imageIndex - Image index
   * @returns {string} HTML image
   */
  generateImageHtml(image, imageIndex) {
    if (!image.base64) {
      // Fallback for images without base64 data
      return `<div style="margin: 10px 0; padding: 10px; background: #f0f0f0; border: 1px dashed #ccc; text-align: center;">
  <p style="color: #666; margin: 0;">[Image ${imageIndex + 1}: ${image.name}]</p>
</div>\n`;
    }
    
    const dataUrl = `data:${image.mimeType};base64,${image.base64}`;
    const style = 'max-width: 100%; height: auto; display: block; margin: 10px 0;';
    
    return `<img src="${dataUrl}" alt="Image ${imageIndex + 1}" style="${style}" />\n`;
  }

  /**
   * Generate minimal CSS styles
   * @param {Array} elements - Text elements
   * @param {Object} viewport - PDF viewport
   * @returns {string} CSS styles
   */
  generateStyles(elements, viewport) {
    return `
body {
  margin: 0;
  padding: 20px;
  background: #f0f0f0;
  font-family: Arial, sans-serif;
  line-height: 1.6;
}

p {
  margin: 10px 0;
  white-space: pre-wrap;
}

h1, h2, h3, h4, h5, h6 {
  margin: 15px 0 10px 0;
  line-height: 1.3;
}
`;
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Strip outer div wrapper from HTML
   * @param {string} html - HTML string
   * @returns {string} HTML without outer div
   */
  stripOuterDiv(html) {
    if (!html || typeof html !== 'string') return html;
    const trimmed = html.trim();
    const m = trimmed.match(/^<div\b[^>]*>([\s\S]*)<\/div>$/i);
    if (m) return m[1];
    return html;
  }
}

module.exports = HtmlGenerator;
