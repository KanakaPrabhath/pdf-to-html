/**
 * Element Extractor
 * Extracts and processes text elements from PDF pages
 */
class ElementExtractor {
  /**
   * Extract text elements with positioning and styling
   * @param {Object} textContent - PDF.js text content
   * @param {Object} viewport - PDF.js viewport
   * @returns {Array} Array of text elements
   */
  extractElements(textContent, viewport) {
    const elements = [];
    
    textContent.items.forEach((item, index) => {
      const tx = item.transform;
      
      elements.push({
        text: item.str,
        x: tx[4],
        y: viewport.height - tx[5], // Invert Y coordinate
        width: item.width,
        height: item.height,
        fontSize: Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]),
        fontFamily: item.fontName,
        transform: tx,
        hasEOL: item.hasEOL
      });
    });
    
    return elements;
  }

  /**
   * Group elements into rows based on Y position
   * @param {Array} elements - Text elements
   * @returns {Array} Array of rows
   */
  groupIntoRows(elements) {
    const rows = [];
    const sortedElements = [...elements].sort((a, b) => {
      if (Math.abs(a.y - b.y) < 5) return a.x - b.x;
      return a.y - b.y;
    });
    
    let currentRow = [];
    let currentY = null;
    
    for (const element of sortedElements) {
      if (currentY === null || Math.abs(element.y - currentY) < 5) {
        currentRow.push(element);
        currentY = element.y;
      } else {
        if (currentRow.length > 0) {
          rows.push(currentRow);
        }
        currentRow = [element];
        currentY = element.y;
      }
    }
    
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }
    
    return rows;
  }
}

module.exports = ElementExtractor;
