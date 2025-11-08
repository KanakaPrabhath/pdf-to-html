/**
 * Table Detector
 * Detects table structures in text elements
 */
class TableDetector {
  /**
   * Detect table structures in text elements
   * @param {Array} elements - Text elements
   * @param {Array} rows - Pre-grouped rows (optional)
   * @returns {Array} Array of detected tables
   */
  detectTables(elements, rows = null) {
    // Group into rows if not provided
    if (!rows) {
      rows = this.groupIntoRows(elements);
    }
    
    const tables = [];
    let currentTable = [];
    let prevRowY = null;
    let prevRowColumnCount = 0;
    
    for (const row of rows) {
      // A table row should have at least 2-3 columns with similar structure
      if (row.length >= 2) {
        // Check if elements are aligned (potential table)
        const hasAlignment = this.checkAlignment(row);
        const columnCount = row.length;
        
        // Tables should have consistent column counts
        const hasConsistentColumns = prevRowColumnCount === 0 || 
                                      Math.abs(columnCount - prevRowColumnCount) <= 2;
        
        if (hasAlignment && columnCount >= 3 && hasConsistentColumns) {
          // Check if this row is close to previous row (part of same table)
          if (prevRowY !== null && Math.abs(row[0].y - prevRowY) < 40) {
            currentTable.push(row);
            prevRowColumnCount = columnCount;
          } else {
            // Save previous table if it has at least 3 rows
            if (currentTable.length >= 3) {
              tables.push(currentTable);
            }
            currentTable = [row];
            prevRowColumnCount = columnCount;
          }
          prevRowY = row[0].y;
        } else {
          // Not a valid table row, save previous table if valid
          if (currentTable.length >= 3) {
            tables.push(currentTable);
          }
          currentTable = [];
          prevRowY = null;
          prevRowColumnCount = 0;
        }
      } else {
        // Single/double column row, end current table
        if (currentTable.length >= 3) {
          tables.push(currentTable);
        }
        currentTable = [];
        prevRowY = null;
        prevRowColumnCount = 0;
      }
    }
    
    // Don't forget the last table
    if (currentTable.length >= 3) {
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
    const hasReasonableGaps = gaps.every(gap => gap > 5 && gap < 200);
    
    // Check for somewhat consistent spacing
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance = gaps.reduce((sum, gap) => sum + Math.abs(gap - avgGap), 0) / gaps.length;
    
    // Stricter criteria: need reasonable gaps AND reasonable consistency
    return hasReasonableGaps && variance < 50;
  }
}

module.exports = TableDetector;
