# PDF to HTML Converter - Architecture

## Project Structure

```
src/
├── index.js                          # Main entry point
├── PdfToHtmlConverter.js             # Main converter class (orchestrator)
├── extractors/                       # Element extraction modules
│   ├── ElementExtractor.js           # Text element extraction
│   └── ImageExtractor.js             # Image extraction with base64 encoding
├── detectors/                        # Structure detection modules
│   ├── TableDetector.js              # Table structure detection
│   └── ListDetector.js               # List structure detection
└── generators/                       # HTML generation modules
    └── HtmlGenerator.js              # HTML and CSS generation
```

## Module Responsibilities

### PdfToHtmlConverter (Main Orchestrator)
- Coordinates the conversion process
- Manages PDF document loading and page processing
- Delegates to specialized modules for extraction, detection, and generation

### ElementExtractor
- Extracts text elements from PDF pages
- Processes positioning and styling information
- Groups elements into rows for further analysis

### ImageExtractor
- Extracts images from PDF operator lists
- Converts image data to base64 encoding
- Handles different image formats (grayscale, RGB, RGBA)
- Uses canvas for image data manipulation

### TableDetector
- Detects table structures in text elements
- Analyzes column alignment and spacing
- Groups rows into coherent table structures

### ListDetector
- Detects ordered and unordered lists
- Removes duplicate list markers to prevent double bullets/numbers
- Handles list item continuation across lines

### HtmlGenerator
- Generates semantic HTML from extracted elements
- Improved paragraph detection with proper line break handling
- Creates HTML for tables, lists, and images
- Generates CSS styles
- Properly handles base64 image embedding

## Key Improvements

### 1. Paragraph Identification
The new `groupIntoSemanticBlocks` method properly identifies paragraphs by:
- Checking vertical gaps between lines
- Considering font size consistency
- Using `hasEOL` markers from PDF.js
- Distinguishing between same-line continuation and new paragraphs

### 2. Image Handling
Images are now properly extracted and embedded:
- Full base64 encoding of image data
- Support for grayscale, RGB, and RGBA formats
- Proper data URL generation with MIME types
- Fallback display for images that can't be extracted

### 3. List Processing
Lists no longer show double markers:
- Markers are detected and removed before HTML generation
- Original text is preserved for list type detection
- Proper handling of list item continuations

### 4. Modular Architecture
- Each module has a single, well-defined responsibility
- Easy to test individual components
- Simple to extend or modify specific functionality
- Clear separation of concerns

## Usage

```javascript
const { PdfToHtmlConverter } = require('pdf-to-html-converter');

const converter = new PdfToHtmlConverter({
  includeImages: true,
  includeTables: true,
  includeLists: true
});

const pages = await converter.convertToHtml('document.pdf');
```

## Dependencies

- **pdfjs-dist**: PDF parsing and rendering
- **canvas**: Image data manipulation and base64 conversion
