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

  /**
   * Merge adjacent text elements on the same line into logical cells
   * This is useful for table detection where spaces are separate elements
   * @param {Array} elements - Text elements
   * @param {number} maxGap - Maximum gap between elements to merge (default: 10)
   * @returns {Array} Array of merged elements
   */
  mergeAdjacentElements(elements, maxGap = 10) {
    if (!elements || elements.length === 0) return [];
    
    // First group into rows
    const rows = this.groupIntoRows(elements);
    const mergedElements = [];
    
    rows.forEach(row => {
      // Filter out empty elements
      const nonEmptyElements = row.filter(el => el.text.trim().length > 0);
      
      if (nonEmptyElements.length === 0) return;
      
      let merged = [];
      let currentCell = null;
      
      for (const element of nonEmptyElements) {
        if (!currentCell) {
          currentCell = { 
            ...element,
            sourceElements: [element] // Track original elements
          };
        } else {
          const gap = element.x - (currentCell.x + currentCell.width);
          
          // If gap is small, merge into current cell
          if (gap <= maxGap) {
            currentCell.text += element.text;
            currentCell.width = (element.x + element.width) - currentCell.x;
            currentCell.sourceElements.push(element);
          } else {
            // Gap is large, this is a new cell
            merged.push(currentCell);
            currentCell = { 
              ...element,
              sourceElements: [element]
            };
          }
        }
      }
      
      // Don't forget the last cell
      if (currentCell) {
        merged.push(currentCell);
      }
      
      mergedElements.push(...merged);
    });
    
    return mergedElements;
  }
}

module.exports = ElementExtractor;
