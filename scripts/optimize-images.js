const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { optimize } = require('svgo');
const glob = require('glob');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const MAX_DIMENSION = 2048;
const ICON_MAX_DIMENSION_NO_RESIZE = 256; // Icons smaller than this won't be resized down.

const sharpOptions = {
  jpeg: { quality: 80, progressive: true },
  png: { compressionLevel: 8, quality: 80, palette: true }, // Added palette for potential indexed color benefits
  webp: { quality: 80, effort: 4 }, // effort 0-6, higher is slower but better
  gif: { effort: 4 }, // effort 0-10
};

const svgoOptions = {
  plugins: [
    { name: 'removeDoctype', active: true },
    { name: 'removeXMLProcInst', active: true },
    { name: 'removeComments', active: true },
    { name: 'removeMetadata', active: true },
    { name: 'removeEditorsNSData', active: true },
    { name: 'cleanupAttrs', active: true },
    { name: 'mergeStyles', active: true },
    { name: 'inlineStyles', active: true },
    { name: 'minifyStyles', active: true },
    { name: 'cleanupIDs', active: true },
    { name: 'removeUselessDefs', active: true },
    { name: 'cleanupNumericValues', active: true },
    { name: 'convertColors', active: true },
    { name: 'removeUnknownsAndDefaults', active: true },
    { name: 'removeNonInheritableGroupAttrs', active: true },
    { name: 'removeUselessStrokeAndFill', active: true },
    { name: 'removeViewBox', active: false }, // Keep viewBox for scalability
    { name: 'cleanupEnableBackground', active: true },
    { name: 'removeHiddenElems', active: true },
    { name: 'removeEmptyText', active: true },
    { name: 'convertShapeToPath', active: true },
    { name: 'convertEllipseToCircle', active: true },
    { name: 'moveElemsAttrsToGroup', active: true },
    { name: 'moveGroupAttrsToElems', active: true },
    { name: 'collapseGroups', active: true },
    { name: 'convertPathData', active: true },
    { name: 'convertTransform', active: true },
    { name: 'removeEmptyAttrs', active: true },
    { name: 'removeEmptyContainers', active: true },
    { name: 'mergePaths', active: true },
    { name: 'removeUnusedNS', active: true },
    { name: 'sortDefsChildren', active: true },
    { name: 'removeTitle', active: true },
    { name: 'removeDesc', active: true },
  ],
};

async function getFileSize(filePath) {
  const stats = await fs.stat(filePath);
  return stats.size;
}

async function optimizeImage(filePath) {
  const originalSize = await getFileSize(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const baseName = path.basename(filePath, ext);
  const dirName = path.dirname(filePath);

  let report = {
    file: path.relative(PUBLIC_DIR, filePath),
    originalSize,
    newSize: originalSize,
    originalResolution: '',
    newResolution: '',
    formatConvertedTo: null,
    error: null,
  };

  try {
    if (ext === '.svg') {
      const svgContent = await fs.readFile(filePath, 'utf-8');
      const result = optimize(svgContent, { ...svgoOptions, path: filePath });
      if (result.data) {
        await fs.writeFile(filePath, result.data);
        report.newSize = Buffer.byteLength(result.data, 'utf-8');
      } else {
        throw new Error('SVGO optimization returned no data.');
      }
    } else if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.tiff'].includes(ext)) {
      const image = sharp(filePath);
      const metadata = await image.metadata();
      report.originalResolution = `${metadata.width}x${metadata.height}`;
      report.newResolution = report.originalResolution;

      let needsResize = false;
      let targetWidth = metadata.width;
      let targetHeight = metadata.height;

      const isIcon = filePath.includes(path.sep + 'icons' + path.sep) || 
                     baseName.includes('favicon') || 
                     baseName.includes('apple-touch-icon') ||
                     baseName.includes('logo');

      if (!isIcon || (metadata.width > ICON_MAX_DIMENSION_NO_RESIZE || metadata.height > ICON_MAX_DIMENSION_NO_RESIZE)) {
        if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
          needsResize = true;
          if (metadata.width >= metadata.height) {
            targetWidth = MAX_DIMENSION;
            targetHeight = null; // sharp will maintain aspect ratio
          } else {
            targetHeight = MAX_DIMENSION;
            targetWidth = null;
          }
        }
      }
      
      let sharpInstance = image;
      if (needsResize) {
        sharpInstance = sharpInstance.resize(targetWidth, targetHeight, { fit: 'inside', withoutEnlargement: true });
        // Get new dimensions after resize for report
        const tempResizedBuffer = await sharpInstance.toBuffer(); // Avoids writing to disk just for metadata
        const resizedMetadata = await sharp(tempResizedBuffer).metadata();
        report.newResolution = `${resizedMetadata.width}x${resizedMetadata.height}`;
      }

      // Convert to WebP (except for favicons and apple-touch-icon which often need to be PNG)
      const outputPath = path.join(dirName, `${baseName}.webp`);
      if (ext !== '.webp' && !baseName.includes('favicon') && !baseName.includes('apple-touch-icon') && ext !== '.ico') {
        await sharpInstance.webp(sharpOptions.webp).toFile(outputPath);
        report.newSize = await getFileSize(outputPath);
        report.formatConvertedTo = 'webp';
        // Remove original file if conversion was successful and different name
        if (filePath !== outputPath) {
            try { await fs.unlink(filePath); } catch (e) { console.warn(`Could not delete original ${filePath} after webp conversion: ${e.message}`);}
        }
      } else { // Optimize original format if not converting to webp or if it's already webp
        let optimizedBuffer;
        if (ext === '.png') optimizedBuffer = await sharpInstance.png(sharpOptions.png).toBuffer();
        else if (ext === '.jpg' || ext === '.jpeg') optimizedBuffer = await sharpInstance.jpeg(sharpOptions.jpeg).toBuffer();
        else if (ext === '.webp') optimizedBuffer = await sharpInstance.webp(sharpOptions.webp).toBuffer();
        else if (ext === '.gif') optimizedBuffer = await sharpInstance.gif(sharpOptions.gif).toBuffer();
        // Add other formats if needed (AVIF, TIFF)
        
        if (optimizedBuffer) {
          await fs.writeFile(filePath, optimizedBuffer);
          report.newSize = Buffer.byteLength(optimizedBuffer);
        }
      }
    } else if (ext === '.ico') {
      report.error = 'ICO optimization not supported by this script.';
    } else {
      // Not an image type we handle
      return null;
    }
  } catch (err) {
    console.error(`Error optimizing ${filePath}:`, err);
    report.error = err.message;
  }
  return report;
}

async function main() {
  console.log(`Scanning for images in ${PUBLIC_DIR}...`);
  const imagePaths = glob.sync(`${PUBLIC_DIR}/**/*.{png,jpg,jpeg,webp,svg,gif,avif,tiff}`, {
    nodir: true,
    ignore: [`${PUBLIC_DIR}/**/*.test.*`, `${PUBLIC_DIR}/**/*.spec.*`], // Exclude test files
  });
  
  // Handle potential double extension like .png.png
  const cleanedImagePaths = imagePaths.map(p => {
    if (p.endsWith('.png.png')) return p.substring(0, p.length - 4);
    return p;
  });
  // Filter out duplicates after cleaning
  const uniqueImagePaths = [...new Set(cleanedImagePaths)];


  console.log(`Found ${uniqueImagePaths.length} images to process.`);
  const reports = [];

  for (const imagePath of uniqueImagePaths) {
    // Check if file exists before processing, especially after cleaning double extensions
    try {
        await fs.access(imagePath);
    } catch (e) {
        console.warn(`Skipping ${imagePath} as it does not exist (possibly due to extension cleaning).`);
        continue;
    }
    const report = await optimizeImage(imagePath);
    if (report) {
      reports.push(report);
      const saving = report.originalSize - report.newSize;
      const savingPercent = ((saving / report.originalSize) * 100).toFixed(2);
      console.log(
        `Processed: ${report.file} | ${report.originalResolution} -> ${report.newResolution || report.originalResolution} | ${(report.originalSize / 1024).toFixed(1)}KB -> ${(report.newSize / 1024).toFixed(1)}KB | Saved: ${(saving / 1024).toFixed(1)}KB (${savingPercent}%) ${report.formatConvertedTo ? `(-> ${report.formatConvertedTo})` : ''} ${report.error ? `| ERROR: ${report.error}` : ''}`
      );
    }
  }

  // Generate summary report
  const totalOriginalSize = reports.reduce((sum, r) => sum + r.originalSize, 0);
  const totalNewSize = reports.reduce((sum, r) => sum + r.newSize, 0);
  const totalSaving = totalOriginalSize - totalNewSize;
  const overallSavingPercent = totalOriginalSize > 0 ? ((totalSaving / totalOriginalSize) * 100).toFixed(2) : 0;

  console.log(`\n--- Optimization Summary ---`);
  console.log(`Total images processed: ${reports.length}`);
  console.log(`Total original size: ${(totalOriginalSize / (1024*1024)).toFixed(2)} MB`);
  console.log(`Total new size: ${(totalNewSize / (1024*1024)).toFixed(2)} MB`);
  console.log(`Total saved: ${(totalSaving / (1024*1024)).toFixed(2)} MB (${overallSavingPercent}%)`);

  const errors = reports.filter(r => r.error);
  if (errors.length > 0) {
    console.log(`\n--- Errors (${errors.length}) ---`);
    errors.forEach(r => console.log(`${r.file}: ${r.error}`));
  }

  // Save detailed report to a file
  const reportDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportDir)){
        await fs.mkdir(reportDir, { recursive: true });
    }
  const reportFilePath = path.join(reportDir, 'image-optimization-report.json');
  await fs.writeFile(reportFilePath, JSON.stringify(reports, null, 2));
  console.log(`\nDetailed report saved to ${path.relative(path.join(__dirname, '..'), reportFilePath)}`);
}

main().catch(console.error);
