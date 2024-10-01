import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import {
  qrCodes as qrCodesTable,
  qrImages as qrImagesTable,
  insertQrCodeSchema,
} from "../db/schema-mysql/qr";
import { eq, desc } from "drizzle-orm";
import { createQrCodeSchema, createShortUrlSchema } from "../shared-types";
import { generateQR } from "../image-processing/qr-gen";
import {
  base64OutputHandler,
  localFileOutputHandler,
  s3OutputHandler,
  type ImageDetails,
} from "../image-processing/output-handlers";
import { logger } from "../lib/logger";
import crypto from "crypto";

import { blends } from "../shared-types";

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;

function generateRandomHexName(length: number = 16): string {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}

function generateShortUrlString(length: number = 6): string {
  const bytes = crypto.randomBytes(Math.ceil((length * 3) / 4));
  return bytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .slice(0, length);
}

function isLikelyUrl(text: string): boolean {
  // Regular expression to match common URL patterns
  const urlPattern =
    /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;

  // Check if the text starts with a common protocol
  const hasProtocol = /^(http:\/\/|https:\/\/)/i.test(text);

  // Check if the text contains a domain-like structure
  const hasDomainStructure = /^[\w-]+(\.[\w-]+)+/.test(text);

  return urlPattern.test(text) || hasProtocol || hasDomainStructure;
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
  .post("/", zValidator("form", createQrCodeSchema), async (c) => {
    const qrData = await c.req.valid("form");

    const bgImageBuffer = await qrData.bgImage?.arrayBuffer();
    const qrImageBuffer = await qrData.qrImage.arrayBuffer();

    logger.info(`bucketName: ${bucketName}, bucketRegion: ${bucketRegion}`);
    const fileOutputHandler =
      bucketName && bucketRegion
        ? s3OutputHandler({
            bucketName,
            region: bucketRegion,
            folder: qrData.id ? `qr-codes/${qrData.id}` : "tmp",
          })
        : localFileOutputHandler(import.meta.dir + "/../uploads");

    let imageDetails: ImageDetails[] = [];

    if (qrData.save === "true" && qrData.id) {
      // save the initial QR code
      const qrImageId = generateShortUrlString();
      const fileName = generateRandomHexName() + ".webp";

      // save the file to disk
      const details = await fileOutputHandler({
        buffer: Buffer.from(qrImageBuffer),
        name: fileName,
        blend: "none",
      });
      imageDetails.push(details);

      // save the file to the database
      await db.insert(qrImagesTable).values({
        id: qrImageId,
        qrCodeId: qrData.id,
        imageName: fileName,
        filter: "none",
      });
    }

    if (!bgImageBuffer) {
      c.status(201);
      return c.json({
        id: qrData.id,
        files: imageDetails,
      });
    }

    const blendsToProcess = qrData.blend ? [qrData.blend] : blends;

    // process all other images
    for (const blend of blendsToProcess) {
      const buffer = await generateQR(qrImageBuffer, bgImageBuffer, blend, 30);
      const fileName = generateRandomHexName() + ".webp";
      if (qrData.save === "true" && qrData.id) {
        // save to disk
        const details = await fileOutputHandler({
          buffer,
          name: fileName,
          blend,
        });
        imageDetails.push(details);

        logger.info(`Saved image with blend ${blend}, file name ${fileName}, url ${details.url}`);

        const qrImageId = generateShortUrlString();

        await db.insert(qrImagesTable).values({
          id: qrImageId,
          qrCodeId: qrData.id,
          imageName: fileName,
          filter: blend,
        });
      } else {
        // just store to buffer
        const details = await base64OutputHandler({
          buffer,
          name: fileName,
          blend,
        });
        imageDetails.push(details);
      }
    }

    c.status(201);
    return c.json({
      id: qrData.id,
      files: imageDetails,
    });
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");

    let [qrCode, qrImages] = await Promise.all([
      db
        .select()
        .from(qrCodesTable)
        .where(eq(qrCodesTable.id, id))
        .then((res) => res[0]),
      db.select().from(qrImagesTable).where(eq(qrImagesTable.qrCodeId, id)),
    ]);

    type Image = (typeof qrImages)[number] & { url?: string };
    let images: Image[] = qrImages;

    if (bucketName && bucketRegion) {
      images = qrImages.map((qrImage) => {
        const url = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/qr-codes/${qrCode.id}/${qrImage.imageName}`;
        logger.info(`Image URL: ${url}`);
        return { ...qrImage, url };
      });
    }

    if (!qrCode) {
      logger.error(`QR code not found for id ${id}`);
      return c.json({ error: "QR code not found" }, 404);
    }

    return c.json({ qrCode, qrImages: images });
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");

    // delete images

    await db.delete(qrCodesTable).where(eq(qrCodesTable.id, id));

    return c.json({ id });
  });

export default qrRoute;
