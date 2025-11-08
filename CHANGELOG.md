# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-11-08

### Added
- **Modular Architecture**: Reorganized code into specialized modules
  - `extractors/ElementExtractor.js`: Text element extraction
  - `extractors/ImageExtractor.js`: Image extraction with base64 encoding
  - `detectors/TableDetector.js`: Table structure detection
  - `detectors/ListDetector.js`: List structure detection
  - `generators/HtmlGenerator.js`: HTML and CSS generation
- **Image Base64 Encoding**: Full implementation of image extraction with base64 conversion
  - Support for grayscale, RGB, and RGBA image formats
  - Canvas-based image data manipulation
  - Proper data URL generation with MIME types
- **ARCHITECTURE.md**: Comprehensive documentation of the modular structure

### Fixed
- **Paragraph Identification**: Improved paragraph detection algorithm
  - Better vertical gap analysis between lines
  - Font size consistency checking
  - Proper use of `hasEOL` markers from PDF.js
  - Smarter line break handling
  - Distinction between same-line continuation and new paragraphs
- **Image Display**: Images now properly display with base64 encoding
  - Previously only showed placeholders
  - Now extracts and embeds actual image data
- **Double List Markers**: Fixed duplicate bullets and numbers in lists
  - Lists no longer show "• • Item" or "1. 1. Item"
  - Markers are properly removed during detection phase
  - Clean text used in HTML generation

### Changed
- Refactored `PdfToHtmlConverter.js` to use modular components
- Updated `README.md` with new features and architecture information
- Added `canvas` dependency for image processing (v2.11.2)

### Technical Improvements
- Single Responsibility Principle applied to all modules
- Better separation of concerns
- Easier to test individual components
- Improved maintainability and extensibility
- No breaking changes to public API

## [1.0.1] - 2025-11-08

### Changed
- Updated `pdfjs-dist` from 3.11.174 to 5.4.394 (latest version)
- Removed `canvas` dependency as it was not being used in the codebase
- Simplified installation process - no need for `--no-optional` flag
- Updated documentation to reflect removal of canvas dependency

### Removed
- Canvas package and all related code (unused dependency)
- Windows-specific installation notes (no longer needed)

## [1.0.0] - 2025-11-07

### Added
- Initial release of PDF to HTML Converter
- Page-by-page PDF processing
- Text extraction with positioning and styling preservation
- Automatic table detection and conversion
- List recognition (bullets and numbered lists)
- Image extraction framework
- HTML and CSS generation
- Security features (HTML escaping)
- Comprehensive API with multiple conversion methods
- Example scripts and test suite
- Full documentation (README.md and GETTING_STARTED.md)

### Features
- **PdfToHtmlConverter class**: Main converter with full control
- **convertPdfToHtml()**: Convert PDF to array of pages
- **convertPdfToSingleHtml()**: Convert PDF to single HTML document
- Customizable options for styles, images, tables, and lists
- Support for both file paths and buffers

### Dependencies
- pdfjs-dist: ^5.4.394 (updated from 3.11.174)

### Examples
- `basic-usage.js`: Basic conversion examples
- `test.js`: Test suite for library features
- `demo.js`: Interactive demo without requiring PDF files
- `create-sample-pdf.js`: Helper to create test PDFs

### Documentation
- README.md: Full API documentation and usage guide
- GETTING_STARTED.md: Step-by-step guide for beginners
- Inline code documentation and comments

### Supported Features
- ✅ Text extraction with absolute positioning
- ✅ Font size and family preservation
- ✅ Table detection based on column alignment
- ✅ List detection (bullet points and numbered lists)
- ✅ Image extraction placeholders
- ✅ CSS style generation
- ✅ Multiple output formats (pages array or single document)
- ✅ HTML escaping for security

### Known Limitations
- Complex PDF layouts may require manual adjustment
- Advanced PDF features (forms, annotations) not fully supported
- Image quality depends on original PDF resolution

### Installation Notes
- Requires Node.js >= 14.0.0
- Single dependency: pdfjs-dist

---

## Future Enhancements (Planned)

### Version 1.1.0 (Planned)
- Enhanced table detection algorithm
- Better handling of multi-column layouts
- Improved image extraction with actual data
- Support for PDF bookmarks/outlines
- Progress callbacks for large PDFs

### Version 1.2.0 (Planned)
- PDF form field extraction
- Annotation support
- Custom template system
- Batch processing utilities
- CLI tool for command-line usage

### Version 2.0.0 (Planned)
- TypeScript support
- Plugin architecture
- Advanced layout analysis
- Semantic HTML generation
- Accessibility enhancements

---

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

MIT License - see LICENSE file for details
