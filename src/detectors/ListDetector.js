/**
 * List Detector
 * Detects list structures in text elements
 */
class ListDetector {
  constructor() {
    // Enhanced list markers - supports:
    // - Bullets: •, ○, ●, -, *, ·, etc.
    // - Numbers: 1., 2), 3., etc.
    // - Numbers with parentheses: (1), (2), etc.
    // - Numbers with brackets: [1], [2], etc.
    // - Lowercase letters: a., b), c., etc.
    // - Uppercase letters: A., B), C., etc.
    // - Sinhala letters: අ., ආ., ඇ., ඈ., etc.
    // - Roman numerals (lowercase): i., ii., iii., iv., v., etc.
    // - Roman numerals (uppercase): I., II., III., IV., V., etc.
    this.listMarkers = /^[\u2022\u2023\u25E6\u2043\u2219•·○●\-\*](\s+|$)|^\d+[\.\)](\s+|$)|^\(\d+\)(\s+|$)|^\[\d+\](\s+|$)|^[a-z][\.\)](\s+|$)|^[A-Z][\.\)](\s+|$)|^[\u0D80-\u0DFF][\.\)](\s+|$)|^[ivxlcdm]+[\.\)](\s+|$)|^[IVXLCDM]+[\.\)](\s+|$)/i;
    
    // Standalone marker (just the symbol/number without text)
    this.standaloneMarker = /^[\u2022\u2023\u25E6\u2043\u2219•·○●\-\*]$|^\d+[\.\)]$|^\(\d+\)$|^\[\d+\]$|^[a-z][\.\)]$|^[A-Z][\.\)]$|^[\u0D80-\u0DFF][\.\)]$|^[ivxlcdm]+[\.\)]$|^[IVXLCDM]+[\.\)]$/i;
  }

  /**
   * Detect list structures in text elements
   * @param {Array} elements - Text elements
   * @returns {Array} Array of detected lists with nested structure support
   */
  detectLists(elements) {
    const lists = [];
    let currentList = [];
    let lastListItemY = null;
    let pendingMarker = null; // Store standalone markers
    let baseIndent = null; // Track the base indentation level
    
    // Sort elements by position
    const sortedElements = [...elements].sort((a, b) => {
      if (Math.abs(a.y - b.y) < 5) return a.x - b.x;
      return a.y - b.y;
    });
    
    for (let i = 0; i < sortedElements.length; i++) {
      const element = sortedElements[i];
      const trimmedText = element.text.trim();
      
      // Skip empty or whitespace-only elements
      if (!trimmedText) {
        continue;
      }
      
      // Check if this is a standalone marker (e.g., "1." or "•" by itself)
      if (this.standaloneMarker.test(trimmedText)) {
        pendingMarker = element;
        continue; // Skip to next element to get the actual text
      }
      
      // Check if we have a pending marker and this is its text
      if (pendingMarker && Math.abs(element.y - pendingMarker.y) < 5) {
        // Combine marker with text
        const cleanedElement = {
          ...element,
          text: element.text.trim(),
          isListItem: true,
          originalText: pendingMarker.text + ' ' + element.text,
          sourceElements: [pendingMarker, element], // Track original elements for exclusion
          indent: pendingMarker.x // Track indentation level
        };
        
        // Set base indent on first item
        if (currentList.length === 0 || baseIndent === null) {
          baseIndent = pendingMarker.x;
        }
        
        // Calculate nesting level based on indentation
        cleanedElement.level = this.calculateNestingLevel(pendingMarker.x, baseIndent);
        
        // Check if this is part of the current list or a new list
        // Items should be close together AND of the same type
        const isCloseEnough = currentList.length > 0 && Math.abs(element.y - lastListItemY) < 30;
        const isSameType = currentList.length > 0 ? this.isSameListType(currentList[0], cleanedElement) : true;
        
        if (isCloseEnough && isSameType) {
          // Continue current list
          currentList.push(cleanedElement);
        } else {
          // Start a new list (either first item, too far away, or different type)
          if (currentList.length > 0) {
            lists.push(this.buildNestedStructure(currentList));
          }
          currentList = [cleanedElement];
          baseIndent = pendingMarker.x;
        }
        
        lastListItemY = element.y;
        pendingMarker = null;
        continue;
      }
      
      // Check if this element starts with a list marker (marker and text together)
      if (this.hasListMarker(trimmedText)) {
        // Remove the marker from the text to avoid duplication
        const cleanedText = this.removeListMarker(trimmedText);
        
        // Create a new element with cleaned text
        const cleanedElement = {
          ...element,
          text: cleanedText,
          isListItem: true,
          originalText: element.text,
          sourceElements: [element], // Track original element for exclusion
          indent: element.x // Track indentation level
        };
        
        // Set base indent on first item
        if (currentList.length === 0 || baseIndent === null) {
          baseIndent = element.x;
        }
        
        // Calculate nesting level based on indentation
        cleanedElement.level = this.calculateNestingLevel(element.x, baseIndent);
        
        // Check if this is part of the current list
        // Items should be close together AND of the same type (both numbered or both bulleted)
        const isCloseEnough = lastListItemY !== null && Math.abs(element.y - lastListItemY) < 30;
        const isSameType = currentList.length > 0 ? this.isSameListType(currentList[0], cleanedElement) : true;
        
        if (isCloseEnough && isSameType) {
          currentList.push(cleanedElement);
        } else {
          // Start a new list (either too far away or different type)
          if (currentList.length > 0) {
            lists.push(this.buildNestedStructure(currentList));
          }
          currentList = [cleanedElement];
          baseIndent = element.x;
        }
        
        lastListItemY = element.y;
      } else if (currentList.length > 0) {
        // Check if this is a continuation of the previous list item (same line or indented continuation)
        const lastItem = currentList[currentList.length - 1];
        const isSameLine = Math.abs(element.y - lastItem.y) < 5;
        const isIndentedContinuation = element.x > lastItem.x && Math.abs(element.y - lastListItemY) < 30;
        
        if (isSameLine || isIndentedContinuation) {
          // Append to the last list item
          lastItem.text += ' ' + element.text;
          // IMPORTANT: Track this element to prevent duplicate rendering
          if (!lastItem.sourceElements) {
            lastItem.sourceElements = [];
          }
          lastItem.sourceElements.push(element);
        } else {
          // End of list
          if (currentList.length > 0) {
            lists.push(this.buildNestedStructure(currentList));
          }
          currentList = [];
          lastListItemY = null;
          baseIndent = null;
        }
      }
      
      // Reset pending marker if we didn't use it
      if (pendingMarker && Math.abs(element.y - pendingMarker.y) >= 5) {
        pendingMarker = null;
      }
    }
    
    // Add the last list if it exists
    if (currentList.length > 0) {
      lists.push(this.buildNestedStructure(currentList));
    }
    
    return lists;
  }

  /**
   * Check if text starts with a list marker
   * @param {string} text - Text to check
   * @returns {boolean} True if text has list marker
   */
  hasListMarker(text) {
    return this.listMarkers.test(text);
  }

  /**
   * Remove list marker from text to prevent duplication
   * @param {string} text - Text with list marker
   * @returns {string} Text without list marker
   */
  removeListMarker(text) {
    return text.replace(this.listMarkers, '').trim();
  }

  /**
   * Calculate nesting level based on indentation
   * @param {number} currentIndent - Current element's x position
   * @param {number} baseIndent - Base indentation of the list
   * @returns {number} Nesting level (0 for main level, 1+ for nested)
   */
  calculateNestingLevel(currentIndent, baseIndent) {
    const indentDiff = currentIndent - baseIndent;
    const indentThreshold = 20; // pixels of indentation per level
    
    if (indentDiff < indentThreshold / 2) {
      return 0; // Main level
    }
    
    return Math.floor(indentDiff / indentThreshold);
  }

  /**
   * Build nested list structure from flat list items
   * @param {Array} items - Flat array of list items with level property
   * @returns {Array} Nested list structure
   */
  buildNestedStructure(items) {
    if (!items || items.length === 0) return [];
    
    const result = [];
    const stack = [{ children: result, level: -1 }];
    
    items.forEach(item => {
      const level = item.level || 0;
      
      // Pop stack until we find the parent level
      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      
      // Add item to current parent's children
      const parent = stack[stack.length - 1];
      
      // Create new item with potential children array
      const newItem = {
        ...item,
        children: []
      };
      
      parent.children.push(newItem);
      
      // Push this item onto stack as potential parent
      stack.push({ children: newItem.children, level });
    });
    
    return result;
  }

  /**
   * Determine if a list is ordered or unordered
   * @param {Array} list - List elements
   * @returns {string} 'ordered' or 'unordered'
   */
  getListType(list) {
    if (list.length === 0) return 'unordered';
    
    const firstText = list[0].originalText || list[0].text;
    
    // Check for ordered list patterns:
    // - Numbers: 1., 2), etc.
    // - Numbers with parentheses: (1), (2), etc.
    // - Numbers with brackets: [1], [2], etc.
    // - Letters: a., b), A., B), etc.
    // - Sinhala letters: අ., ආ., etc.
    // - Roman numerals: i., ii., I., II., etc.
    const isOrdered = /^\d+[\.\)]|^\(\d+\)|^\[\d+\]|^[a-zA-Z][\.\)]|^[\u0D80-\u0DFF][\.\)]|^[ivxlcdm]+[\.\)]|^[IVXLCDM]+[\.\)]/i.test(firstText);
    
    return isOrdered ? 'ordered' : 'unordered';
  }

  /**
   * Check if two list items have the same type (both ordered or both unordered)
   * @param {Object} item1 - First list item
   * @param {Object} item2 - Second list item
   * @returns {boolean} True if same type
   */
  isSameListType(item1, item2) {
    const text1 = item1.originalText || item1.text;
    const text2 = item2.originalText || item2.text;
    
    // Check if both are ordered (numbers, letters, Sinhala letters, or roman numerals)
    const isOrdered1 = /^\d+[\.\)]|^\(\d+\)|^\[\d+\]|^[a-zA-Z][\.\)]|^[\u0D80-\u0DFF][\.\)]|^[ivxlcdm]+[\.\)]|^[IVXLCDM]+[\.\)]/i.test(text1);
    const isOrdered2 = /^\d+[\.\)]|^\(\d+\)|^\[\d+\]|^[a-zA-Z][\.\)]|^[\u0D80-\u0DFF][\.\)]|^[ivxlcdm]+[\.\)]|^[IVXLCDM]+[\.\)]/i.test(text2);
    
    return isOrdered1 === isOrdered2;
  }
}

module.exports = ListDetector;
