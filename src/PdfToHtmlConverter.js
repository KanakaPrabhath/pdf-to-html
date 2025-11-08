const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

/**
 * PDF to HTML Converter
 * Converts PDF files to HTML with styles and elements, processing page by page
 */
class PdfToHtmlConverter {
  constructor(options = {}) {
    this.options = {
      includeStyles: true,
      includeImages: true,
      includeTables: true,
      includeLists: true,
      imageFormat: 'png',
      ...options
    };
  }

  /**
   * Convert a PDF file to HTML
   * @param {string|Buffer} pdfPath - Path to PDF file or PDF buffer
   * @param {Object} options - Conversion options
   * @returns {Promise<Array>} Array of HTML pages
   */
  async convertToHtml(pdfPath, options = {}) {
    const conversionOptions = { ...this.options, ...options };
    
    try {
      // Load PDF document
      const loadingTask = typeof pdfPath === 'string' 
        ? pdfjsLib.getDocument(pdfPath)
        : pdfjsLib.getDocument({ data: pdfPath });
      
      const pdfDocument = await loadingTask.promise;
      const numPages = pdfDocument.numPages;
      
      const pages = [];
      
      // Process each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const pageHtml = await this.convertPage(pdfDocument, pageNum, conversionOptions);
        pages.push({
          pageNumber: pageNum,
          html: pageHtml.html,
          styles: pageHtml.styles,
          width: pageHtml.width,
          height: pageHtml.height
        });
      }
      
      return pages;
    } catch (error) {
      throw new Error(`Failed to convert PDF: ${error.message}`);
    }
  }

  /**
   * Convert a single page to HTML
   * @param {PDFDocumentProxy} pdfDocument - PDF document
   * @param {number} pageNumber - Page number to convert
   * @param {Object} options - Conversion options
   * @returns {Promise<Object>} Page HTML and metadata
   */
  async convertPage(pdfDocument, pageNumber, options) {
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.5 });
    
    // Get text content
    const textContent = await page.getTextContent();
    
    // Get operator list for detailed rendering info
    const operatorList = await page.getOperatorList();
    
    // Extract page elements
    const elements = this.extractElements(textContent, viewport);
    
    // Extract images if enabled
    let images = [];
    if (options.includeImages) {
      images = await this.extractImages(page, operatorList, viewport);
    }
    
    // Detect tables and lists
    let tables = [];
    let lists = [];
    
    if (options.includeTables) {
      tables = this.detectTables(elements);
    }
    
    if (options.includeLists) {
      lists = this.detectLists(elements);
    }
    
    // Generate HTML
    const html = this.generateHtml(elements, images, tables, lists, viewport);
    const styles = this.generateStyles(elements, viewport);
    
    return {
      html,
      styles,
      width: viewport.width,
      height: viewport.height
    };
  }

  /**
   * Extract text elements with positioning and styling
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
   * Extract images from PDF page
   */
  async extractImages(page, operatorList, viewport) {
    const images = [];
    
    try {
      // Get common objects
      const commonObjs = page.commonObjs;
      const objs = page.objs;
      
      // Look for image operations
      for (let i = 0; i < operatorList.fnArray.length; i++) {
        const fn = operatorList.fnArray[i];
        const args = operatorList.argsArray[i];
        
        // OPS.paintImageXObject or OPS.paintInlineImageXObject
        if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintInlineImageXObject) {
          try {
            const objId = args[0];
            
            images.push({
              type: 'image',
              name: objId,
              position: i,
              // Image data would be extracted here in production
              placeholder: true
            });
          } catch (imgError) {
            console.warn('Failed to extract image:', imgError.message);
          }
        }
      }
    } catch (error) {
      console.warn('Image extraction error:', error.message);
    }
    
    return images;
  }

  /**
   * Detect table structures in text elements
   */
  detectTables(elements) {
    const tables = [];
    const rows = this.groupIntoRows(elements);
    
    // Improved table detection - more strict criteria
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
   * Detect list structures in text elements
   */
  detectLists(elements) {
    const lists = [];
    let currentList = [];
    
    const listMarkers = /^[\u2022\u2023\u25E6\u2043\u2219•·○●\-\*]\s*|^\d+[\.\)]\s*|^[a-z][\.\)]\s*/;
    
    for (const element of elements) {
      if (listMarkers.test(element.text)) {
        currentList.push(element);
      } else if (currentList.length > 0) {
        // Check if this is a continuation of the previous list item
        const lastItem = currentList[currentList.length - 1];
        if (Math.abs(element.y - lastItem.y) < 5 && element.x > lastItem.x) {
          currentList.push(element);
        } else if (currentList.length > 1) {
          lists.push([...currentList]);
          currentList = [];
        }
      }
    }
    
    if (currentList.length > 1) {
      lists.push(currentList);
    }
    
    return lists;
  }

  /**
   * Group elements into rows
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

  /**
   * Generate HTML from extracted elements
   */
  generateHtml(elements, images, tables, lists, viewport) {
    let html = `<div style="width: ${viewport.width}px; height: ${viewport.height}px; position: relative; background: white; margin: 0; padding: 0; font-family: Arial, sans-serif;">`;
    
    const processedElements = new Set();
    
    // Add tables
    tables.forEach((table, tableIndex) => {
      html += this.generateTableHtml(table, tableIndex);
      table.forEach(row => row.forEach(el => processedElements.add(el)));
    });
    
    // Add lists
    lists.forEach((list, listIndex) => {
      html += this.generateListHtml(list, listIndex);
      list.forEach(el => processedElements.add(el));
    });
    
    // Add images
    images.forEach((image, imageIndex) => {
      html += `<div style="display: inline-block; margin: 10px;" data-image="${image.name}">
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="Image ${imageIndex + 1}" style="max-width: 100%; height: auto;" />
      </div>`;
    });
    
    // Add remaining text elements
    elements.forEach((element, index) => {
      if (!processedElements.has(element) && element.text.trim()) {
        html += `<span style="position: absolute; left: ${element.x}px; top: ${element.y}px; font-size: ${element.fontSize}px; white-space: pre;">${this.escapeHtml(element.text)}</span>`;
      }
    });
    
    html += '</div>';
    return html;
  }

  /**
   * Generate HTML table with inline styles
   */
  generateTableHtml(table, tableIndex) {
    if (!table || table.length === 0) return '';
    
    // Calculate table position from first row
    const firstRow = table[0];
    const tableX = Math.min(...firstRow.map(el => el.x));
    const tableY = firstRow[0].y;
    
    let html = `<table style="position: absolute; left: ${tableX}px; top: ${tableY}px; border-collapse: collapse; background: white; border: 1px solid #ddd;">`;
    
    table.forEach((row, rowIndex) => {
      html += '<tr>';
      row.forEach(cell => {
        const tag = rowIndex === 0 ? 'th' : 'td';
        const style = rowIndex === 0 
          ? 'border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2; font-weight: bold;'
          : 'border: 1px solid #ddd; padding: 8px; text-align: left;';
        html += `<${tag} style="${style}">${this.escapeHtml(cell.text)}</${tag}>`;
      });
      html += '</tr>';
    });
    
    html += '</table>';
    return html;
  }

  /**
   * Generate HTML list with inline styles
   */
  generateListHtml(list, listIndex) {
    if (!list || list.length === 0) return '';
    
    const isOrdered = /^\d+[\.\)]/.test(list[0].text);
    const tag = isOrdered ? 'ol' : 'ul';
    
    // Calculate list position
    const listX = list[0].x;
    const listY = list[0].y;
    
    let html = `<${tag} style="position: absolute; left: ${listX}px; top: ${listY}px; margin: 0; padding-left: 20px;">`;
    
    list.forEach(item => {
      const text = item.text.replace(/^[\u2022\u2023\u25E6\u2043\u2219•·○●\-\*]\s*|^\d+[\.\)]\s*|^[a-z][\.\)]\s*/, '');
      html += `<li style="margin: 5px 0;">${this.escapeHtml(text)}</li>`;
    });
    
    html += `</${tag}>`;
    return html;
  }

  /**
   * Generate minimal CSS styles (now mostly inline)
   */
  generateStyles(elements, viewport) {
    // Return minimal styles since we're using inline styles
    let styles = `
body {
  margin: 0;
  padding: 20px;
  background: #f0f0f0;
  font-family: Arial, sans-serif;
}
`;
    
    return styles;
  }

  /**
   * Escape HTML special characters
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
   * Convert all pages to a single HTML document
   * @param {string|Buffer} pdfPath - Path to PDF file or PDF buffer
   * @returns {Promise<string>} Inner HTML content (without HTML document wrapper)
   */
  async convertToSingleHtml(pdfPath) {
    const pages = await this.convertToHtml(pdfPath);

    let html = '';

    pages.forEach(page => {
      html += `\n<!-- Page ${page.pageNumber} -->\n`;
      html += page.html;
    });

    return html;
  }
}

module.exports = PdfToHtmlConverter;
