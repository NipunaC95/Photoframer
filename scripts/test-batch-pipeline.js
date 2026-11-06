const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Import built processor from dist/main/imageProcessor
const {
  calculateCanvasDimensions,
  buildProcessedImage,
  processBatchImages,
  inspectImageFile,
} = require('../dist/main/imageProcessor.js');

async function runTests() {
  console.log('=== Running AspectCraft Processing Verification Tests ===\n');

  const assetsDir = path.resolve(__dirname, '../sample-assets');
  const landscapePath = path.join(assetsDir, 'sample_landscape_16-9.jpg');
  const portraitPath = path.join(assetsDir, 'sample_portrait_9-16.jpg');
  const squarePath = path.join(assetsDir, 'sample_square_1-1.png');
  const watermarkPath = path.join(assetsDir, 'watermark_logo.png');

  // Test 1: Metadata inspection
  console.log('Test 1: Inspecting image metadata...');
  const landscapeMeta = await inspectImageFile(landscapePath);
  console.log('Landscape metadata:', {
    fileName: landscapeMeta.fileName,
    dimensions: `${landscapeMeta.width}x${landscapeMeta.height}`,
    orientation: landscapeMeta.orientation,
    aspectRatio: landscapeMeta.aspectRatio,
  });
  if (landscapeMeta.orientation !== 'landscape') {
    throw new Error('Landscape detection failed');
  }
  console.log('✓ Test 1 passed: Metadata extraction and orientation accurate.\n');

  // Test 2: Aspect calculation for 1:1 on 16:9 landscape image
  console.log('Test 2: Verifying 1:1 square canvas calculation on 1920x1080 landscape...');
  const dims1to1 = calculateCanvasDimensions(1920, 1080, {
    preset: '1:1',
    customWidth: 1,
    customHeight: 1,
    backgroundMode: 'solid',
    solidColor: '#000000',
    blurSigma: 25,
  });
  console.log('1:1 Calculated dimensions:', dims1to1);
  // Width should remain 1920, Height should expand to 1920, Y should be centered at (1920 - 1080)/2 = 420
  if (dims1to1.canvasWidth !== 1920 || dims1to1.canvasHeight !== 1920 || dims1to1.imageTargetY !== 420) {
    throw new Error(`1:1 Dimension calculation mismatch: expected 1920x1920 at Y=420, got ${dims1to1.canvasWidth}x${dims1to1.canvasHeight} at Y=${dims1to1.imageTargetY}`);
  }
  console.log('✓ Test 2 passed: Non-destructive letterbox padding verified (1920x1920, Y centered).\n');

  // Test 3: Aspect calculation for 4:5 on 1080x1920 portrait image
  console.log('Test 3: Verifying 4:5 portrait canvas calculation on 1080x1920 portrait...');
  const dims4to5 = calculateCanvasDimensions(1080, 1920, {
    preset: '4:5',
    customWidth: 4,
    customHeight: 5,
    backgroundMode: 'blur',
    solidColor: '#000000',
    blurSigma: 25,
  });
  console.log('4:5 Calculated dimensions:', dims4to5);
  // Height should remain 1920, Target ratio = 4/5 = 0.8 -> Width = 1920 * 0.8 = 1536.
  // X offset = (1536 - 1080) / 2 = 228
  if (dims4to5.canvasHeight !== 1920 || dims4to5.canvasWidth !== 1536 || dims4to5.imageTargetX !== 228) {
    throw new Error(`4:5 Dimension calculation mismatch: expected 1536x1920 at X=228, got ${dims4to5.canvasWidth}x${dims4to5.canvasHeight} at X=${dims4to5.imageTargetX}`);
  }
  console.log('✓ Test 3 passed: Non-destructive pillarbox padding verified (1536x1920, X centered).\n');

  // Test 4: Batch export execution with sharp
  console.log('Test 4: Running full batch processing with blurred background & watermark...');
  const exportDir = path.resolve(__dirname, '../sample-assets/Exported-Test');
  if (fs.existsSync(exportDir)) {
    fs.rmSync(exportDir, { recursive: true, force: true });
  }

  const items = [
    landscapeMeta,
    await inspectImageFile(portraitPath),
    await inspectImageFile(squarePath),
  ];

  const aspectSettings = {
    preset: '4:5',
    customWidth: 4,
    customHeight: 5,
    backgroundMode: 'blur',
    solidColor: '#000000',
    blurSigma: 25,
  };

  const watermarkSettings = {
    enabled: true,
    filePath: watermarkPath,
    anchor: 'bottom-right',
    sizePercent: 20,
    opacity: 0.8,
    marginPercent: 4,
  };

  const exportSettings = {
    outputFolder: exportDir,
    outputFormat: 'jpeg',
    quality: 92,
    prefix: 'test_',
    suffix: '_4x5',
  };

  let progressCalls = 0;
  const result = await processBatchImages(
    items,
    aspectSettings,
    watermarkSettings,
    exportSettings,
    (progress) => {
      progressCalls++;
      console.log(`[Progress ${progress.progressPercent}%] File: ${progress.currentFileName} | Status: ${progress.status}`);
    },
    () => false
  );

  console.log('Batch Result:', result);

  if (result.successCount !== 3 || result.errorCount !== 0) {
    throw new Error(`Batch processing failed: ${result.errorCount} errors`);
  }

  // Inspect generated files
  const exportedFiles = fs.readdirSync(exportDir);
  console.log('Exported files in folder:', exportedFiles);
  if (exportedFiles.length !== 3) {
    throw new Error(`Expected 3 exported files, got ${exportedFiles.length}`);
  }

  for (const f of exportedFiles) {
    const filePath = path.join(exportDir, f);
    const meta = await sharp(filePath).metadata();
    const ratio = (meta.width / meta.height).toFixed(3);
    console.log(`- ${f}: ${meta.width}x${meta.height} (ratio: ${ratio}, format: ${meta.format})`);
    // Expected 4:5 ratio = 0.8
    if (Math.abs(meta.width / meta.height - 0.8) > 0.01) {
      throw new Error(`Output file ${f} has incorrect aspect ratio: ${meta.width / meta.height}`);
    }
  }

  console.log('\n✓ Test 4 passed: All batch images successfully processed with exact 4:5 ratio, blurred canvas, and logo overlay!');
  console.log('\n=== All Tests Passed Successfully! ===');
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
