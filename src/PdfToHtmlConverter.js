const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
const ElementExtractor = require('./extractors/ElementExtractor');
const ImageExtractor = require('./extractors/ImageExtractor');
const TableDetector = require('./detectors/TableDetector');
const ListDetector = require('./detectors/ListDetector');
const HtmlGenerator = require('./generators/HtmlGenerator');

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
    
    // Initialize modules
    this.elementExtractor = new ElementExtractor();
    this.imageExtractor = new ImageExtractor();
    this.tableDetector = new TableDetector();
    this.listDetector = new ListDetector();
    this.htmlGenerator = new HtmlGenerator();
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
        // Strip outer wrapper div so callers get inner HTML fragment
        const inner = this.htmlGenerator.stripOuterDiv(pageHtml.html);
        pages.push({
          pageNumber: pageNum,
          html: inner,
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
    
    // Get text content with Unicode format
    // normalizeWhitespace: false preserves original spacing
    // disableCombineTextItems: false allows PDF.js to combine text items efficiently
    const textContent = await page.getTextContent({
      normalizeWhitespace: false,
      disableCombineTextItems: false
    });
    
    // Get operator list for detailed rendering info
    const operatorList = await page.getOperatorList();
    
    // Extract page elements using ElementExtractor
    const elements = this.elementExtractor.extractElements(textContent, viewport);
    
    // Extract images if enabled using ImageExtractor
    let images = [];
    if (options.includeImages) {
      images = await this.imageExtractor.extractImages(page, operatorList, viewport);
    }
    
    // Detect lists and tables using specialized detectors
    // IMPORTANT: Detect lists FIRST to prevent lists from being misidentified as tables
    let tables = [];
    let lists = [];
    
    if (options.includeLists) {
      lists = this.listDetector.detectLists(elements);
    }
    
    if (options.includeTables) {
      // Merge adjacent elements for better table detection
      // This helps when spaces and numbers are separate elements
      const mergedElements = this.elementExtractor.mergeAdjacentElements(elements, 10);
      
      // Pass lists to table detector so it can exclude list elements
      tables = this.tableDetector.detectTables(mergedElements, null, lists);
    }
    
    // Generate HTML using HtmlGenerator
    const html = this.htmlGenerator.generateHtml(elements, images, tables, lists, viewport);
    const styles = this.htmlGenerator.generateStyles(elements, viewport);
    
    return {
      html,
      styles,
      width: viewport.width,
      height: viewport.height
    };
  }

  /**
   * Convert all pages to a single HTML document
   * @param {string|Buffer} pdfPath - Path to PDF file or PDF buffer
   * @returns {Promise<string>} Inner HTML content (without HTML document wrapper)
   */
  async convertToSingleHtml(pdfPath) {
    const pages = await this.convertToHtml(pdfPath);

    // Build inner HTML with page-break markers between pages
    const fragments = [];
    pages.forEach((page, idx) => {
      fragments.push(page.html || '');
      if (idx < pages.length - 1) {
        fragments.push(`<page-break data-page-break="true" data-page-number="${page.pageNumber + 1}"></page-break>`);
      }
    });

    return fragments.join('\n');
  }
}

module.exports = PdfToHtmlConverter;
