import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc } from "drizzle-orm";

import { db } from "../db";
import {
  qrCodes as qrCodesTable,
  qrImages as qrImagesTable,
} from "../db/schema-mysql/qr";

import {
  createQrCodeSchema,
  previewQrCodeSchema,
  createShortUrlSchema,
  blends,
  type Blend,
} from "../shared-types";

import { generateQR } from "../image-processing/qr-gen";
import {
  base64OutputHandler,
  localFileOutputHandler,
  s3OutputHandler,
  type ImageDetails,
} from "../image-processing/output-handlers";

import { logger } from "../lib/logger";
import {
  generateRandomHexName,
  generateShortUrlString,
  isLikelyUrl,
} from "../lib/utils";

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;

/**
 * Determines the appropriate file output handler based on environment variables.
 * @param qrCodeId Optional QR code ID for folder structuring.
 */
function getFileOutputHandler(qrCodeId?: string) {
  if (bucketName && bucketRegion) {
    return s3OutputHandler({
      bucketName,
      region: bucketRegion,
      folder: qrCodeId ? `qr-codes/${qrCodeId}` : 'tmp',
    });
  } else {
    return localFileOutputHandler(import.meta.dir + '/../uploads');
  }
}

/**
 * Helper function to process images.
 * @param qrImageBuffer The QR code image buffer.
 * @param bgImageBuffer The background image buffer.
 * @param blendsToProcess Array of blends to apply.
 * @param outputHandler Function to handle the output of images.
 * @param saveToDb Whether to save the images to the database.
 * @param qrCodeId Optional QR code ID for database reference.
 */
async function processImages(
  qrImageBuffer: ArrayBuffer,
  bgImageBuffer: ArrayBuffer,
  blendsToProcess: Blend[],
  outputHandler: ReturnType<typeof base64OutputHandler> | ReturnType<typeof s3OutputHandler> | ReturnType<typeof localFileOutputHandler>,
  saveToDb: boolean,
  paddingSize: number,
  qrCodeId?: string, 
): Promise<ImageDetails[]> {
  const imageDetails: ImageDetails[] = [];

  for (const blend of blendsToProcess) {
    const buffer = await generateQR(qrImageBuffer, bgImageBuffer, blend, paddingSize);
    const fileName = `${generateRandomHexName()}.webp`;

    const details = await outputHandler({
      buffer,
      name: fileName,
      blend,
    });
    imageDetails.push(details);

    if (saveToDb && qrCodeId) {
      const qrImageId = generateShortUrlString();
      await db.insert(qrImagesTable).values({
        id: qrImageId,
        qrCodeId: qrCodeId,
        imageName: fileName,
        filter: blend,
      });
    }
  }

  return imageDetails;
}

export const qrRoute = new Hono()
  .get("/", async (c) => {
    const qrCodes = await db
      .select()
      .from(qrCodesTable)
      .orderBy(desc(qrCodesTable.createdAt))
      .limit(100);

    return c.json({ qrCodes });
  })
  .post("/short-url", zValidator("json", createShortUrlSchema), async (c) => {
    const qrData = await c.req.valid("json");
    const shortString = generateShortUrlString();
    const type = isLikelyUrl(qrData.text) ? "url" : "text";

    logger.info(`Creating a short URL for ${qrData.text} with type ${type}`);
    await db.insert(qrCodesTable).values({
      id: shortString,
      content: qrData.text,
      type,
    });

    return c.json({ id: shortString, type }, 201);
  })
  .post('/', zValidator('form', createQrCodeSchema), async (c) => {
    // save code to db and s3
    const qrData = await c.req.valid('form');
  
    const bgImageBuffer = await qrData.bgImage.arrayBuffer();
    const qrImageBuffer = await qrData.qrImage.arrayBuffer();
  
    logger.info(`bucketName: ${bucketName}, bucketRegion: ${bucketRegion}`);
    const fileOutputHandler = getFileOutputHandler(qrData.id);
  
    // Save the initial QR code image
    const initialQrImageBuffer = Buffer.from(qrImageBuffer);
    const initialFileName = `${generateRandomHexName()}.webp`;
  
    const initialDetails = await fileOutputHandler({
      buffer: initialQrImageBuffer,
      name: initialFileName,
      blend: 'none',
    });
  
    // Save the initial image to the database
    const initialQrImageId = generateShortUrlString();
    await db.insert(qrImagesTable).values({
      id: initialQrImageId,
      qrCodeId: qrData.id,
      imageName: initialFileName,
      filter: 'none',
    });
  
    // Process additional images with blends
    const blendsToProcess = blends;
    const imageDetails = await processImages(
      qrImageBuffer,
      bgImageBuffer,
      blendsToProcess,
      fileOutputHandler,
      true,
      50,
      qrData.id,
    );
  
    // Include the initial image in the response
    imageDetails.unshift(initialDetails);
  
    c.status(201);
    return c.json({
      id: qrData.id,
      files: imageDetails,
    });
  }).post('/preview', zValidator('form', previewQrCodeSchema), async (c) => {
    const qrData = await c.req.valid('form');
  
    const bgImageBuffer = await qrData.bgImage.arrayBuffer();
    const qrImageBuffer = await qrData.qrImage.arrayBuffer();
  
    const blendsToProcess = qrData.blend ? [qrData.blend] : blends;
  
    const imageDetails = await processImages(
      qrImageBuffer,
      bgImageBuffer,
      blendsToProcess,
      base64OutputHandler(),
      false,
      30
    );
  
    c.status(200);
    return c.json({
      files: imageDetails,
    });
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");

    const qrCodePromise = db
      .select()
      .from(qrCodesTable)
      .where(eq(qrCodesTable.id, id))
      .then((res) => res[0]);

    const qrImagesPromise = db
      .select()
      .from(qrImagesTable)
      .where(eq(qrImagesTable.qrCodeId, id));

    const [qrCode, qrImages] = await Promise.all([
      qrCodePromise,
      qrImagesPromise,
    ]);

    if (!qrCode) {
      logger.error(`QR code not found for id ${id}`);
      return c.json({ error: "QR code not found" }, 404);
    }

    type Image = (typeof qrImages)[number] & { url?: string };
    let images: Image[] = qrImages;

    if (bucketName && bucketRegion) {
      images = qrImages.map((qrImage) => {
        const url = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/qr-codes/${qrCode.id}/${qrImage.imageName}`;
        logger.info(`Image URL: ${url}`);
        return { ...qrImage, url };
      });
    }

    return c.json({ qrCode, qrImages: images });
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");

    // Delete images and QR code
    await db.delete(qrCodesTable).where(eq(qrCodesTable.id, id));

    return c.json({ id });
  });

export default qrRoute;
