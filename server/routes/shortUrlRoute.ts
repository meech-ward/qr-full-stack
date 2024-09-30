import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import {
  qrCodes as qrCodesTable,
  qrImages as qrImagesTable,
  qrUses as qrUsesTable,
} from "../db/schema-mysql/qr";
import { eq } from "drizzle-orm";
import { getConnInfo } from "hono/bun";
import { logger } from "../lib/logger";

export const shortUrlRoute = new Hono().get("/:id", async (c) => {
  const id = c.req.param("id");

  const qrCode = await db
    .select()
    .from(qrCodesTable)
    .where(eq(qrCodesTable.id, id))
    .then((res) => res[0]);

  if (!qrCode) {
    return c.notFound();
  }
  const info = getConnInfo(c); // info is `ConnInfo`

  const ipAddress =
    c.req.header("X-Forwarded-For") ||
    c.req.header("X-Real-IP") ||
    info.remote.address;

  await db.insert(qrUsesTable).values({
    qrId: qrCode.id,
    ipAddress: ipAddress,
    userAgent: c.req.header("User-Agent"),
    location: c.req.header("Location") || c.req.header("Origin"),
    referer: c.req.header("Referer"),
  });

  logger.info(`QR code ${qrCode.id} used with IP address ${ipAddress}`);

  if (qrCode.type === "url") {
    logger.info(`Redirecting to ${qrCode.content}`);
    const hasProtocol = /^[a-zA-Z]+:\/\//.test(qrCode.content);
    const url = hasProtocol ? qrCode.content : `https://${qrCode.content}`;
    return c.redirect(url);
  }

  logger.info(`QR code ${qrCode.id} content: ${qrCode.content}`);

  return c.text(qrCode.content);
});

export default shortUrlRoute;
