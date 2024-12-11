import qr from 'qrcode';
import sharp, { type Blend as SharpBlend } from 'sharp';
import { type Blend } from '../shared-types';
import PQueue from 'p-queue';
import { logger } from '../lib/logger';
import { sleep } from '../lib/utils';

const quality = process.env.IMAGE_QUALITY ? parseInt(process.env.IMAGE_QUALITY) : 75;
const delayBetweenTasks = process.env.DELAY_BETWEEN_TASKS ? parseInt(process.env.DELAY_BETWEEN_TASKS) : 1000;

const queue = new PQueue({ concurrency: 1 });

// Pre-generate buffers for white overlays:
const whitePixel50 = Buffer.from([255, 255, 255, 50]);
const whitePixel150 = Buffer.from([255, 255, 255, 150]);

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
    const paddedQrCodeBuffer = (!paddingSize || paddingSize <= 0)
      ? qrCodeBuffer
      : await sharp(qrCodeBuffer)
          .extend({
            top: paddingSize,
            bottom: paddingSize,
            left: paddingSize,
            right: paddingSize,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          })
          .toBuffer();

    const { width: qrCodeWidth, height: qrCodeHeight } = await sharp(paddedQrCodeBuffer).metadata();
    if (!qrCodeWidth || !qrCodeHeight) {
      throw new Error('Failed to read QR code dimensions');
    }

    logger.info(
      `Processing QR code with dimensions ${qrCodeWidth}x${qrCodeHeight}, quality: ${quality}, blend mode: ${blendMode}`
    );

    const processedImage = await sharp(imageBuffer)
      .resize(qrCodeWidth, qrCodeHeight, { fit: 'cover' })
      .toBuffer();

    const qrCodeMask = await sharp(paddedQrCodeBuffer)
      .ensureAlpha()
      .threshold(128)
      .toBuffer();

    let finalBuffer: Buffer;

    switch (blendMode) {
      case 'normal':
        finalBuffer = await sharp(processedImage)
          .composite([{ input: qrCodeMask, blend: 'add' }])
          .webp({ quality })
          .toBuffer();
        break;

      case 'dark':
        finalBuffer = await sharp(processedImage)
          .modulate({ brightness: 0.7 })
          .composite([{ input: qrCodeMask, blend: 'add' }])
          .webp({ quality })
          .toBuffer();
        break;

      case 'multiply-dark': {
        const lessBrightImage = await sharp(processedImage)
          .composite([
            {
              input: whitePixel50,
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
        const backgroundImage = await sharp(processedImage)
          .composite([
            {
              input: whitePixel150,
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

  queue.add(() => sleep(delayBetweenTasks));

  if (!result) {
    throw new Error('Failed to generate QR code');
  }
  return result;
}
