/**
 * Table Detector
 * Detects table structures in text elements
 */
class TableDetector {
  /**
   * Detect table structures in text elements
   * @param {Array} elements - Text elements
   * @param {Array} rows - Pre-grouped rows (optional)
   * @param {Array} lists - Detected lists to exclude (optional)
   * @returns {Array} Array of detected tables
   */
  detectTables(elements, rows = null, lists = []) {
    // Create a set of list elements to exclude (using source elements)
    const listElements = new Set();
    lists.forEach(list => {
      list.forEach(item => {
        if (item.sourceElements) {
          // Add all source elements used in this list item
          item.sourceElements.forEach(el => listElements.add(el));
        }
      });
    });
    
    // Filter out list elements
    const filteredElements = elements.filter(el => !listElements.has(el));
    
    // Group into rows if not provided
    if (!rows) {
      rows = this.groupIntoRows(filteredElements);
    }
    
    const tables = [];
    let currentTable = [];
    let prevRowY = null;
    let prevRowColumnCount = 0;
    
    for (const row of rows) {
      // Check if this row could be part of a table
      const hasMultipleColumns = row.length >= 3;
      const hasSingleColumn = row.length === 1;
      
      if (hasMultipleColumns) {
        // Multi-column row - potential table header or data row
        const hasAlignment = this.checkAlignment(row);
        const columnCount = row.length;
        
        // Tables should have consistent column counts
        const hasConsistentColumns = prevRowColumnCount === 0 || 
                                      Math.abs(columnCount - prevRowColumnCount) <= 2;
        
        if (hasAlignment && hasConsistentColumns) {
          // Check if this row is close to previous row (part of same table)
          if (prevRowY !== null && Math.abs(row[0].y - prevRowY) < 40) {
            currentTable.push(row);
            prevRowColumnCount = columnCount;
          } else {
            // Save previous table if it has at least 2 rows (reduced from 3)
            if (currentTable.length >= 2) {
              tables.push(currentTable);
            }
            currentTable = [row];
            prevRowColumnCount = columnCount;
          }
          prevRowY = row[0].y;
        } else {
          // Not a valid table row, save previous table if valid
          if (currentTable.length >= 2) {
            tables.push(currentTable);
          }
          currentTable = [];
          prevRowY = null;
          prevRowColumnCount = 0;
        }
      } else if (hasSingleColumn && currentTable.length > 0 && prevRowY !== null) {
        // Single column row - could be part of table if following a multi-column header
        // Check if it's close to the previous row
        if (Math.abs(row[0].y - prevRowY) < 40) {
          // Add this single-column row to the table
          // Expand it to match the column count - first cell has data, rest are empty
          const expandedRow = [];
          for (let i = 0; i < prevRowColumnCount; i++) {
            if (i === 0) {
              expandedRow.push(row[0]);
            } else {
              // Create empty cell placeholder
              expandedRow.push({ 
                text: '', 
                x: row[0].x + (i * 100), // Estimate position
                y: row[0].y,
                isEmpty: true 
              });
            }
          }
          currentTable.push(expandedRow);
          prevRowY = row[0].y;
        } else {
          // Too far from previous row, end table
          if (currentTable.length >= 2) {
            tables.push(currentTable);
          }
          currentTable = [];
          prevRowY = null;
          prevRowColumnCount = 0;
        }
      } else {
        // Row doesn't fit table pattern, end current table
        if (currentTable.length >= 2) {
          tables.push(currentTable);
        }
        currentTable = [];
        prevRowY = null;
        prevRowColumnCount = 0;
      }
    }
    
    // Don't forget the last table
    if (currentTable.length >= 2) {
      tables.push(currentTable);
    }
    
    return tables;
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
   * Check if elements in a row are aligned (table detection)
   * @param {Array} row - Array of elements in a row
   * @returns {boolean} True if elements are aligned
   */
  checkAlignment(row) {
    if (row.length < 3) return false; // Need at least 3 columns for a table
    
    // Check if there's spacing between elements (columns)
    const gaps = [];
    for (let i = 1; i < row.length; i++) {
      const gap = row[i].x - (row[i-1].x + row[i-1].width);
      gaps.push(gap);
    }
    
    // Elements should have reasonable gaps (not continuous text, not too far apart)
    // Very lenient: allow small overlaps and wide gaps for various table formats  
    const hasReasonableGaps = gaps.every(gap => gap >= -5 && gap < 400);
    
    if (!hasReasonableGaps) return false;
    
    // For rows with 3+ elements, be lenient and assume it's likely a table
    // Just return true if gaps are reasonable
    return true;
  }
}

module.exports = TableDetector;
