import qr from "qrcode";
import sharp, { type Blend } from "sharp";

// Function to generate QR code buffer from text input
export async function generateQrCodeBuffer(
  text: string,
  options?: qr.QRCodeToBufferOptions
): Promise<Buffer> {
  const buffer = await qr.toBuffer(text, {
    type: "png",
    errorCorrectionLevel: "H",
    scale: 10,
    ...options,
  });
  return buffer;
}

const quality = 75;

// New function to generate QR code with specified blend mode
export async function generateQR(
  qrCodeBuffer: Buffer | ArrayBuffer,
  imageBuffer: Buffer | ArrayBuffer,
  blendMode: "normal" | "dark" | "multiply-dark" | Blend,
  paddingSize?: number
): Promise<Buffer> {
  // Add padding to the QR code buffer if needed
  qrCodeBuffer =
    !paddingSize || paddingSize <= 0
      ? qrCodeBuffer
      : await sharp(qrCodeBuffer)
          .extend({
            top: paddingSize,
            bottom: paddingSize,
            left: paddingSize,
            right: paddingSize,
            background: { r: 255, g: 255, b: 255, alpha: 1 }, // White background
          })
          .toBuffer();

  // Get the dimensions of the QR code
  const qrCodeMetadata = await sharp(qrCodeBuffer).metadata();
  console.log(`Processing QR code with dimensions ${qrCodeMetadata.width}x${qrCodeMetadata.height}, quality: ${quality}, blend mode: ${blendMode}`);
  const qrCodeWidth = qrCodeMetadata.width!;
  const qrCodeHeight = qrCodeMetadata.height!;

  // Resize and process the input image
  const image = sharp(imageBuffer);
  const processedImage = await image
    .resize(qrCodeWidth, qrCodeHeight, { fit: "cover" })
    .toBuffer();

  // Create a mask from the QR code
  const qrCodeMask = await sharp(qrCodeBuffer)
    .ensureAlpha()
    .threshold(128)
    .toBuffer();

  let finalBuffer: Buffer;

  switch (blendMode) {
    case "normal": {
      // Mask the QR code to the normal image
      finalBuffer = await sharp(processedImage)
        .composite([
          {
            input: qrCodeMask,
            blend: "add",
          },
        ])
        .webp({
          quality: quality,
        })
        .toBuffer();
      break;
    }
    case "dark": {
      // Darken the image and mask the QR code
      const qrMasked = await sharp(processedImage)
        .modulate({ brightness: 0.7 })
        .composite([
          {
            input: qrCodeMask,
            blend: "add",
          },
        ])
        .webp({
          quality: quality,
        })
        .toBuffer();
      finalBuffer = qrMasked;
      break;
    }
    case "multiply-dark": {
      // Less white background image
      const processedBackgroundImageLess = await sharp(processedImage)
        .composite([
          {
            input: Buffer.from([255, 255, 255, 50]),
            raw: {
              width: 1,
              height: 1,
              channels: 4,
            },
            tile: true,
            blend: "over",
          },
        ])
        .toBuffer();

      // Darken the image and mask the QR code
      const qrMasked = await sharp(processedImage)
        .modulate({ brightness: 0.7 })
        .composite([
          {
            input: qrCodeMask,
            blend: "add",
          },
        ])
        .webp({
          quality: quality,
        })
        .toBuffer();

      // Apply multiply blend
      finalBuffer = await sharp(processedBackgroundImageLess)
        .composite([
          {
            input: qrMasked,
            blend: "multiply",
          },
        ])
        .toBuffer();
      break;
    }
    default: {
      // For other blend modes: "multiply", "exclusion", "color-burn", "hard-light", etc.

      // Process background image
      const processedBackgroundImage = await sharp(processedImage)
        .composite([
          {
            input: Buffer.from([255, 255, 255, 150]),
            raw: {
              width: 1,
              height: 1,
              channels: 4,
            },
            tile: true,
            blend: "over",
          },
        ])
        .toBuffer();

      // Darken the image and mask the QR code
      const qrMasked = await sharp(processedImage)
        .modulate({ brightness: 0.7 })
        .composite([
          {
            input: qrCodeMask,
            blend: "add",
          },
        ])
        .webp({
          quality: quality,
        })
        .toBuffer();

      // Apply specified blend mode
      finalBuffer = await sharp(processedBackgroundImage)
        .composite([
          {
            input: qrMasked,
            blend: blendMode,
          },
        ])
        .toBuffer();
      break;
    }
  }

  return finalBuffer;
}

// Example usage:

// Import or define your image buffer
// const yourImageBuffer: ArrayBuffer = ...;

// Example usage with blend mode:
/*
(async () => {
  const text = "Your QR code text";
  const qrCodeBuffer = await generateQrCodeBuffer(text);

  const blendMode: Blend = "multiply"; // or "normal", "dark", "multiply-dark", "exclusion", etc.

  const qrImageBuffer = await generateQR(qrCodeBuffer, yourImageBuffer, blendMode);

  // Now you can use an output handler to store the image
  const output = await base64OutputHandler({
    buffer: qrImageBuffer,
    name: "output-path.png",
    blend: blendMode,
  });

  console.log(output);
})();
*/
