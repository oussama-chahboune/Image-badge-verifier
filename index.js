/**
 * Author: Oussama Chahboune 
 * Date: 18/02/2024
 * 
 * This Node.js script processes badge images to verify that they meet certain criteria:
 * - The image must be 512x512 pixels in size.
 * - All non-transparent pixels must be within a circular area.
 * - The colors of the badge should convey a "happy" feeling .
 * 
 * The script includes functions to verify the image size and shape, analyze the colors,
 * and convert the image if it meets all the criteria.
 */


const sharp = require('sharp');
const fs = require('fs');
const PNG = require('pngjs').PNG;
const { Image } = require('image-js');

// Define happy color
const happyColors = [
  { r: 255, g: 223, b: 0 }, // Yellow Color 
  // we can add here more happy colors if we want 
];

// Function to determine if a color is close to any color in a list
function isColorCloseToAny(color, colorList, threshold) {
  return colorList.some(happyColor => {
    return Math.abs(color.r - happyColor.r) < threshold &&
           Math.abs(color.g - happyColor.g) < threshold &&
           Math.abs(color.b - happyColor.b) < threshold;
  });
}

// Function to analyze the image and check for happy colors
async function analyzeImageForHappyColors(imagePath) {
  let image = await Image.load(imagePath);
  let rgbaImage = image.rgba8(); 

  const colorThreshold = 30; // How close a color needs to be to be considered "happy"
  let happyPixelsCount = 0;

  for (let y = 0; y < rgbaImage.height; y++) {
    for (let x = 0; x < rgbaImage.width; x++) {
      let idx = (rgbaImage.width * y + x) * 4;
      let color = {
        r: rgbaImage.data[idx],
        g: rgbaImage.data[idx + 1],
        b: rgbaImage.data[idx + 2]
      };
      if (isColorCloseToAny(color, happyColors, colorThreshold)) {
        happyPixelsCount++;
      }
    }
  }
  return happyPixelsCount >= rgbaImage.width * rgbaImage.height * 0.75; // 75% is an arbitrary threshold
}

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
    throw error; 
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


async function processImage(inputImagePath) {
    try {
      await verifyBadgeImage(inputImagePath);
  
      // Analyze the image for happy colors
      const isHappy = await analyzeImageForHappyColors(inputImagePath);
      if (!isHappy) {
        throw new Error('Image colors do not convey a happy feeling.');
      }
      console.log('Color verification passed: Image colors are happy.');
  
      // If all checks pass, the badge image will be converted 
      const outputImagePath = inputImagePath.replace(/(\.[\w\d_-]+)$/i, '_converted.png');
      await convertToBadge(inputImagePath, outputImagePath);
      console.log('Image processed and saved to:', outputImagePath);
    } catch (error) {
      console.error('Error during image processing:', error.message);
    }
  }

processImage('/Users/laurentibars/Desktop/pngimg.com - circle_PNG82.png');

