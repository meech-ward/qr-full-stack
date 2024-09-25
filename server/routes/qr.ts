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
  type ImageDetails,
} from "../image-processing/output-handlers";

import crypto from "crypto";

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
    const type = qrData.text.startsWith("http") ? "url" : "text";

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

    const fileOutputHandler = localFileOutputHandler(
      import.meta.dir + "/../uploads"
    );

    let imageDetails: ImageDetails[] = [];

    if (qrData.save === "true" && qrData.id) {
      // save the initial QR code
      const qrImageId = generateShortUrlString();
      const fileName = generateRandomHexName() + ".png";

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

    // process all other images
    const blends = [
      "multiply-dark",
      "multiply",
      "dark",
      "normal",
      "color-burn",
      "exclusion",
      "hard-light",
    ] as const;
    for (const blend of blends) {
      const buffer = await generateQR(qrImageBuffer, bgImageBuffer, blend, 60);
      const fileName = generateRandomHexName() + ".png";
      if (qrData.save === "true" && qrData.id) {
        // save to disk
        const details = await fileOutputHandler({
          buffer,
          name: fileName,
          blend,
        });
        imageDetails.push(details);

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

    const [qrCode, qrImages] = await Promise.all([
      db
        .select()
        .from(qrCodesTable)
        .where(eq(qrCodesTable.id, id))
        .then((res) => res[0]),
      db.select().from(qrImagesTable).where(eq(qrImagesTable.qrCodeId, id)),
    ]);

    if (!qrCode) {
      return c.notFound();
    }

    return c.json({ qrCode, qrImages });
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");

    // delete images

    await db.delete(qrCodesTable).where(eq(qrCodesTable.id, id));

    return c.json({ id });
  });

export default qrRoute;
