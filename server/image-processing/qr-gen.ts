import qr from 'qrcode';
import sharp, { type Blend as SharpBlend } from 'sharp';
import { type Blend } from '../shared-types';
import PQueue from 'p-queue';
import { logger } from '../lib/logger';
import { sleep } from '../lib/utils';

/**
 * Generates a QR code buffer from text input.
 * @param text The text to encode in the QR code.
 * @param options Optional QR code generation options.
 */
export async function generateQrCodeBuffer(
  text: string,
  options?: qr.QRCodeToBufferOptions,
): Promise<Buffer> {
  const buffer = await qr.toBuffer(text, {
    type: 'png',
    errorCorrectionLevel: 'H',
    scale: 10,
    ...options,
  });
  return buffer;
}

const quality = process.env.IMAGE_QUALITY ? parseInt(process.env.IMAGE_QUALITY) : 75;
const queue = new PQueue({ concurrency: 1 });
const delayBetweenTasks = process.env.DELAY_BETWEEN_TASKS ? parseInt(process.env.DELAY_BETWEEN_TASKS) : 1000;

/**
 * Generates a QR code image with the specified blend mode.
 * @param qrCodeBuffer The buffer of the QR code image.
 * @param imageBuffer The buffer of the background image.
 * @param blendMode The blend mode to apply.
 * @param paddingSize Optional padding size.
 */
export async function generateQR(
  qrCodeBuffer: Buffer | ArrayBuffer,
  imageBuffer: Buffer | ArrayBuffer,
  blendMode: Blend | SharpBlend,
  paddingSize?: number,
): Promise<Buffer> {
  const result = await queue.add(async () => {
    // Add padding to the QR code buffer if needed
    const paddedQrCodeBuffer =
      !paddingSize || paddingSize <= 0
        ? qrCodeBuffer
        : await sharp(qrCodeBuffer)
            // .resize(500, 500)
            .extend({
              top: paddingSize,
              bottom: paddingSize,
              left: paddingSize,
              right: paddingSize,
              background: { r: 255, g: 255, b: 255, alpha: 1 }, // White background
            })
            .toBuffer();

    // Get the dimensions of the QR code
    const qrCodeMetadata = await sharp(paddedQrCodeBuffer).metadata();
    logger.info(
      `Processing QR code with dimensions ${qrCodeMetadata.width}x${qrCodeMetadata.height}, quality: ${quality}, blend mode: ${blendMode}`,
    );
    const qrCodeWidth = qrCodeMetadata.width!;
    const qrCodeHeight = qrCodeMetadata.height!;

    // Resize and process the input image
    const processedImage = await sharp(imageBuffer)
      .resize(qrCodeWidth, qrCodeHeight, { fit: 'cover' })
      .toBuffer();

    // Create a mask from the QR code
    const qrCodeMask = await sharp(paddedQrCodeBuffer)
      .ensureAlpha()
      .threshold(128)
      .toBuffer();

    let finalBuffer: Buffer;

    switch (blendMode) {
      case 'normal': {
        // Mask the QR code to the normal image
        finalBuffer = await sharp(processedImage)
          .composite([{ input: qrCodeMask, blend: 'add' }])
          .webp({ quality })
          .toBuffer();
        break;
      }
      case 'dark': {
        // Darken the image and mask the QR code
        finalBuffer = await sharp(processedImage)
          .modulate({ brightness: 0.7 })
          .composite([{ input: qrCodeMask, blend: 'add' }])
          .webp({ quality })
          .toBuffer();
        break;
      }
      case 'multiply-dark': {
        // Apply multiply blend
        const lessBrightImage = await sharp(processedImage)
          .composite([
            {
              input: Buffer.from([255, 255, 255, 50]),
              raw: { width: 1, height: 1, channels: 4 },
              tile: true,
              blend: 'over',
            },
          ])
          .toBuffer();

        const qrMasked = await sharp(processedImage)
          .modulate({ brightness: 0.7 })
          .composite([{ input: qrCodeMask, blend: 'add' }])
          .webp({ quality })
          .toBuffer();

        finalBuffer = await sharp(lessBrightImage)
          .composite([{ input: qrMasked, blend: 'multiply' }])
          .toBuffer();
        break;
      }
      default: {
        // For other blend modes
        const backgroundImage = await sharp(processedImage)
          .composite([
            {
              input: Buffer.from([255, 255, 255, 150]),
              raw: { width: 1, height: 1, channels: 4 },
              tile: true,
              blend: 'over',
            },
          ])
          .toBuffer();

        const qrMasked = await sharp(processedImage)
          .modulate({ brightness: 0.7 })
          .composite([{ input: qrCodeMask, blend: 'add' }])
          .webp({ quality })
          .toBuffer();

        finalBuffer = await sharp(backgroundImage)
          .composite([{ input: qrMasked, blend: blendMode as SharpBlend }])
          .toBuffer();
        break;
      }
    }

    return finalBuffer;
  });

  // Delay between tasks to prevent overload
  queue.add(() => sleep(delayBetweenTasks));

  if (!result) {
    throw new Error('Failed to generate QR code');
  }
  return result;
}
