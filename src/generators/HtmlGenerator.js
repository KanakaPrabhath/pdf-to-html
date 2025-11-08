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
    // Create a unified structure with all content in document order
    const contentItems = [];
    const processedElements = new Set();
    
    // Add tables with their Y positions
    tables.forEach((table, tableIndex) => {
      const minY = Math.min(...table.map(row => Math.min(...row.map(el => el.y))));
      contentItems.push({
        type: 'table',
        y: minY,
        data: table,
        index: tableIndex
      });
      // Mark source elements as processed (these are the original elements)
      table.forEach(row => row.forEach(el => {
        if (el.sourceElements) {
          el.sourceElements.forEach(src => processedElements.add(src));
        } else {
          processedElements.add(el);
        }
      }));
    });
    
    // Add lists with their Y positions
    lists.forEach((list, listIndex) => {
      const minY = Math.min(...list.map(item => {
        if (item.sourceElements && item.sourceElements.length > 0) {
          return item.sourceElements[0].y;
        }
        return item.y || 0;
      }));
      contentItems.push({
        type: 'list',
        y: minY,
        data: list,
        index: listIndex
      });
      // Mark source elements as processed
      list.forEach(item => {
        if (item.sourceElements) {
          item.sourceElements.forEach(el => processedElements.add(el));
        } else {
          processedElements.add(item);
        }
      });
    });
    
    // Add images with their Y positions
    images.forEach((image, imageIndex) => {
      contentItems.push({
        type: 'image',
        y: image.y || 0,
        data: image,
        index: imageIndex
      });
    });
    
    // Group remaining text elements into semantic blocks
    const blocks = this.groupIntoSemanticBlocks(elements, processedElements);
    
    // Add blocks to content items
    blocks.forEach(block => {
      contentItems.push({
        type: block.type,
        y: block.y,
        data: block
      });
    });
    
    // Sort all content by Y position (document order)
    contentItems.sort((a, b) => a.y - b.y);
    
    // Generate HTML in document order
    let html = '';
    contentItems.forEach(item => {
      switch (item.type) {
        case 'header':
          const level = this.getHeaderLevel(item.data.fontSize);
          html += `<h${level}>${this.escapeHtml(item.data.text)}</h${level}>\n`;
          break;
        case 'paragraph':
          html += `<p>${this.escapeHtml(item.data.text)}</p>\n`;
          break;
        case 'table':
          html += this.generateTableHtml(item.data, item.index);
          break;
        case 'list':
          html += this.generateListHtml(item.data, item.index);
          break;
        case 'image':
          html += this.generateImageHtml(item.data, item.index);
          break;
      }
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
        const fontSizeDiff = Math.abs(element.fontSize - currentBlock.fontSize);
        
        // Same line (within 5px vertically)
        const isSameLine = verticalGap < 5;
        
        // Check if this line starts at or near the left margin of the paragraph
        const isAtLeftMargin = Math.abs(element.x - currentBlock.x) < 10;
        
        // Detect paragraph breaks:
        // - Large vertical gaps (30px+)
        // - OR returning to left margin with a gap larger than normal line spacing (>20px)
        const normalLineSpacing = verticalGap > 5 && verticalGap <= 20;
        const largeParagraphGap = verticalGap > 20;
        const isParagraphBreak = largeParagraphGap && isAtLeftMargin;
        
        // Next line in same paragraph
        const isNextLineInParagraph = (normalLineSpacing || (largeParagraphGap && !isAtLeftMargin)) && 
                                      fontSizeDiff < 2 && 
                                      blockType === currentBlock.type &&
                                      !isHeader;
        
        // Continue only if same line or next line in paragraph (not a paragraph break)
        shouldContinue = !isParagraphBreak &&
                        (isSameLine || isNextLineInParagraph) && 
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
    
    // Build style with proper dimensions and positioning
    const styleProps = [];
    
    // Set explicit dimensions if available
    if (image.width && image.width > 0) {
      styleProps.push(`width: ${image.width}px`);
    }
    if (image.height && image.height > 0) {
      styleProps.push(`height: ${image.height}px`);
    }
    
    // Default styles
    styleProps.push('display: block');
    styleProps.push('margin: 10px 0');
    
    // If no dimensions were captured, use responsive sizing
    if (!image.width || !image.height) {
      styleProps.push('max-width: 100%');
      styleProps.push('height: auto');
    }
    
    const style = styleProps.join('; ') + ';';
    
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
