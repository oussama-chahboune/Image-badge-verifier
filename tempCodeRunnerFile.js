const sharp = require('sharp');
const fs = require('fs');
const PNG = require('pngjs').PNG;

async function verifyBadgeImage(inputImagePath) {
  try {
    const image = sharp(inputImagePath);
    const metadata = await image.metadata();
    
    if (metadata.width !== 512 || metadata.height !== 512) {
      throw new Error('Image must be 512x512 pixels.');
    }

    await new Promise((resolve, reject) => {
      fs.createReadStream(inputImagePath)
        .pipe(new PNG())
        .on('parsed', function() {
          const centerX = this.width / 2;
          const centerY = this.height / 2;
          const radius = this.width / 2;

          for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
              const idx = (this.width * y + x) << 2;
              // If the pixel is not transparent
              if (this.data[idx+3] !== 0) {
                // Check if it lies outside the circle
                if (Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)) > radius) {
                  // If we find even one pixel outside the circle, reject the promise
                  return reject(new Error(`Pixel at ${x},${y} is outside the circle.`));
                }
              }
            }
          }
          // If all pixels are within the circle, resolve the promise
          resolve();
        });
    });

    console.log('Verification passed: Image is 512x512 pixels and all non-transparent pixels are within a circle.');
  } catch (error) {
    console.error('Verification failed:', error.message);
    throw error; // Rethrow the error to be handled in the processImage function
  }
}

async function convertToBadge(inputImagePath, outputImagePath) {
  try {
    const image = sharp(inputImagePath).resize(512, 512).toFormat('png');
    await image.toFile(outputImagePath);
    console.log('Image converted and saved to:', outputImagePath);
  } catch (error) {
    console.error('Conversion failed:', error.message);
    throw error; // Rethrow the error to be handled in the processImage function
  }
}

async function processImage(inputImagePath) {
  try {
    await verifyBadgeImage(inputImagePath);
    // Define the output path for the converted image
    const outputImagePath = inputImagePath.replace(/(\.[\w\d_-]+)$/i, '_converted.png');
    await convertToBadge(inputImagePath, outputImagePath);
    console.log('Image processed and saved to:', outputImagePath);
  } catch (error) {
    console.error('Error during image processing:', error.message);
  }
}

// Replace the path with the actual path to your image file
processImage('/Users/laurentibars/Desktop/badge_image.png');

