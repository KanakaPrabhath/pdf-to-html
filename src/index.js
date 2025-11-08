const PdfToHtmlConverter = require('./PdfToHtmlConverter');

/**
 * Main entry point for the PDF to HTML converter library
 */

/**
 * Convert PDF to HTML
 * @param {string|Buffer} pdfPath - Path to PDF file or PDF buffer
 * @param {Object} options - Conversion options
 * @returns {Promise<Array>} Array of HTML pages
 */
async function convertPdfToHtml(pdfPath, options = {}) {
  const converter = new PdfToHtmlConverter(options);
  return await converter.convertToHtml(pdfPath);
}

/**
 * Convert PDF to a single HTML document
 * @param {string|Buffer} pdfPath - Path to PDF file or PDF buffer
 * @param {Object} options - Conversion options
 * @returns {Promise<string>} Complete HTML document
 */
async function convertPdfToSingleHtml(pdfPath, options = {}) {
  const converter = new PdfToHtmlConverter(options);
  return await converter.convertToSingleHtml(pdfPath);
}

module.exports = {
  PdfToHtmlConverter,
  convertPdfToHtml,
  convertPdfToSingleHtml
};
