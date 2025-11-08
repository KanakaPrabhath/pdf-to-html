const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

/**
 * Image Extractor
 * Extracts images from PDF pages and converts to base64
 */
class ImageExtractor {
  /**
   * Extract images from PDF page with base64 encoding
   * @param {Object} page - PDF.js page object
   * @param {Object} operatorList - PDF.js operator list
   * @param {Object} viewport - PDF.js viewport
   * @returns {Promise<Array>} Array of image objects with base64 data
   */
  async extractImages(page, operatorList, viewport) {
    const images = [];
    
    try {
      // Track image operations and their transforms
      const imageOps = [];
      
      for (let i = 0; i < operatorList.fnArray.length; i++) {
        const fn = operatorList.fnArray[i];
        const args = operatorList.argsArray[i];
        
        // Detect image painting operations
        if (fn === pdfjsLib.OPS.paintImageXObject || 
            fn === pdfjsLib.OPS.paintInlineImageXObject) {
          imageOps.push({
            index: i,
            name: args[0],
            operation: fn
          });
        }
      }
      
      // Extract actual image data
      for (const imageOp of imageOps) {
        try {
          const imgData = await this.getImageData(page, imageOp.name);
          
          if (imgData) {
            const base64 = await this.convertToBase64(imgData);
            
            images.push({
              type: 'image',
              name: imageOp.name,
              base64: base64,
              mimeType: imgData.mimeType || 'image/png',
              width: imgData.width,
              height: imgData.height,
              position: imageOp.index
            });
          }
        } catch (imgError) {
          console.warn(`Failed to extract image ${imageOp.name}:`, imgError.message);
        }
      }
    } catch (error) {
      console.warn('Image extraction error:', error.message);
    }
    
    return images;
  }

  /**
   * Get image data from PDF page object
   * @param {Object} page - PDF.js page object
   * @param {string} imageName - Image object name
   * @returns {Promise<Object>} Image data object
   */
  async getImageData(page, imageName) {
    try {
      const objs = page.objs;
      
      // Wait for the image to be loaded
      return new Promise((resolve, reject) => {
        objs.get(imageName, (img) => {
          if (!img) {
            reject(new Error('Image not found'));
            return;
          }
          
          try {
            // Extract image data
            const canvas = this.createCanvasFromImage(img);
            if (canvas) {
              resolve({
                canvas: canvas,
                width: img.width || canvas.width,
                height: img.height || canvas.height,
                mimeType: 'image/png'
              });
            } else {
              reject(new Error('Failed to create canvas'));
            }
          } catch (err) {
            reject(err);
          }
        });
      });
    } catch (error) {
      console.warn(`Error getting image data for ${imageName}:`, error.message);
      return null;
    }
  }

  /**
   * Create canvas from PDF image object
   * @param {Object} img - PDF.js image object
   * @returns {Canvas} Canvas with image data
   */
  createCanvasFromImage(img) {
    try {
      const { createCanvas } = require('canvas');
      
      const width = img.width;
      const height = img.height;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      // Handle different image data formats
      if (img.data) {
        const imageData = ctx.createImageData(width, height);
        
        // Convert image data to RGBA format
        const data = img.data;
        const kind = img.kind;
        
        if (kind === 1) {
          // Grayscale
          for (let i = 0, j = 0; i < data.length; i++, j += 4) {
            imageData.data[j] = data[i];
            imageData.data[j + 1] = data[i];
            imageData.data[j + 2] = data[i];
            imageData.data[j + 3] = 255;
          }
        } else if (kind === 2) {
          // RGB
          for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
            imageData.data[j] = data[i];
            imageData.data[j + 1] = data[i + 1];
            imageData.data[j + 2] = data[i + 2];
            imageData.data[j + 3] = 255;
          }
        } else if (kind === 3) {
          // RGBA
          imageData.data.set(data);
        }
        
        ctx.putImageData(imageData, 0, 0);
      }
      
      return canvas;
    } catch (error) {
      console.warn('Error creating canvas from image:', error.message);
      return null;
    }
  }

  /**
   * Convert image data to base64 string
   * @param {Object} imgData - Image data object
   * @returns {Promise<string>} Base64 encoded image
   */
  async convertToBase64(imgData) {
    try {
      if (imgData.canvas) {
        // Convert canvas to base64
        const base64 = imgData.canvas.toDataURL('image/png');
        // Remove data URL prefix to get just base64
        return base64.split(',')[1];
      }
      return null;
    } catch (error) {
      console.warn('Error converting image to base64:', error.message);
      return null;
    }
  }
}

module.exports = ImageExtractor;
