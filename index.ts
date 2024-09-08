import qr from "qrcode";
import sharp from "sharp";

// Parse command-line arguments using Bun's 'argv'
const [inputText, inputImagePath, outputImagePath] = Bun.argv.slice(2);

async function generateQRCode(
  text: string,
  inputImagePath: string,
  outputFile: string
) {
  const qrCodeBuffer = await qr.toBuffer(text, {
    type: "png",
    errorCorrectionLevel: "H",
    scale: 10,
  });
  const imageBuffer = await Bun.file(inputImagePath).arrayBuffer();
  const image = sharp(imageBuffer);

  // Get the dimensions of the QR code
  const qrCodeMetadata = await sharp(qrCodeBuffer).metadata();
  const qrCodeWidth = qrCodeMetadata.width!;
  const qrCodeHeight = qrCodeMetadata.height!;

  // Resize and process the input image
  const processedImage = await image
    .resize(qrCodeWidth, qrCodeHeight, { fit: "cover" })
    .modulate({ brightness: 0.7 }) // Darken the image by reducing brightness to 70%
    .toBuffer();
  const processedImageBuffer = await sharp(processedImage)
    // .greyscale()
    .composite([{
      input: Buffer.from([255, 255, 255, 150]),
      raw: {
        width: 1,
        height: 1,
        channels: 4
      },
      tile: true,
        blend: "over",
      },
    ])
    .toBuffer();

  // Create a mask from the QR code
  const qrCodeMask = await sharp(qrCodeBuffer)
    .ensureAlpha()
    .negate()
    .threshold(128)
    .toBuffer();

  // await sharp(qrCodeMask).toFile(outputFile);

  const qrMasked = await sharp(processedImage)
    // .ensureAlpha()
    .joinChannel(qrCodeMask)
    .png()
    .toBuffer();

  const final = await sharp(processedImageBuffer)
    .composite([
      {
        input: qrMasked,

      },
    ])
    .toBuffer();

  await sharp(final).toFile(outputFile);
  return;

  // Apply the mask to the input image
  const maskedImage = await sharp(processedImage)
    .composite([
      {
        input: qrCodeMask,
        blend: "dest-in",
      },
    ])
    .toBuffer();

  // Create a white background
  const whiteBackground = await sharp({
    create: {
      width: qrCodeWidth,
      height: qrCodeHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  // Composite the masked image onto the white background
  const imageWithQRCode = sharp(whiteBackground).composite([
    {
      input: maskedImage,
      blend: "over",
    },
  ]);

  await imageWithQRCode.toFile(outputFile);
}

try {
  // Run the function with parsed arguments
  const result = await generateQRCode(
    inputText,
    inputImagePath,
    outputImagePath
  );
  console.log(result);
} catch (error) {
  console.error("Error generating QR code:", error);
  throw error;
}
