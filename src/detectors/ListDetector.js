/**
 * List Detector
 * Detects list structures in text elements
 */
class ListDetector {
  constructor() {
    // Enhanced list markers - markers can be standalone or with text
    this.listMarkers = /^[\u2022\u2023\u25E6\u2043\u2219•·○●\-\*](\s+|$)|^\d+[\.\)](\s+|$)|^[a-z][\.\)](\s+|$)/;
    // Standalone marker (just the symbol/number)
    this.standaloneMarker = /^[\u2022\u2023\u25E6\u2043\u2219•·○●\-\*]$|^\d+[\.\)]$/;
  }

  /**
   * Detect list structures in text elements
   * @param {Array} elements - Text elements
   * @returns {Array} Array of detected lists
   */
  detectLists(elements) {
    const lists = [];
    let currentList = [];
    let lastListItemY = null;
    let pendingMarker = null; // Store standalone markers
    
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
          sourceElements: [pendingMarker, element] // Track original elements for exclusion
        };
        
        // Check if this is part of the current list or a new list
        if (currentList.length > 0) {
          // Continue current list
          currentList.push(cleanedElement);
        } else {
          // Start a new list
          currentList = [cleanedElement];
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
          sourceElements: [element] // Track original element for exclusion
        };
        
        // Check if this is part of the current list
        if (lastListItemY !== null && Math.abs(element.y - lastListItemY) < 30) {
          currentList.push(cleanedElement);
        } else {
          // Start a new list
          if (currentList.length > 0) {
            lists.push([...currentList]);
          }
          currentList = [cleanedElement];
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
        } else {
          // End of list
          if (currentList.length > 0) {
            lists.push([...currentList]);
          }
          currentList = [];
          lastListItemY = null;
        }
      }
      
      // Reset pending marker if we didn't use it
      if (pendingMarker && Math.abs(element.y - pendingMarker.y) >= 5) {
        pendingMarker = null;
      }
    }
    
    // Add the last list if it exists
    if (currentList.length > 0) {
      lists.push(currentList);
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
   * Determine if a list is ordered or unordered
   * @param {Array} list - List elements
   * @returns {string} 'ordered' or 'unordered'
   */
  getListType(list) {
    if (list.length === 0) return 'unordered';
    
    const firstText = list[0].originalText || list[0].text;
    const isNumbered = /^\d+[\.\)]/.test(firstText);
    
    return isNumbered ? 'ordered' : 'unordered';
  }
}

module.exports = ListDetector;
