import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import {
  qrCodes as qrCodesTable,
  qrImages as qrImagesTable,
  qrUses as qrUsesTable,
} from "../db/schema-mysql/qr";
import { eq } from "drizzle-orm";
import { getConnInfo } from 'hono/bun'


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
  const info = getConnInfo(c) // info is `ConnInfo`


  await db.insert(qrUsesTable).values({
    qrId: qrCode.id,
    ipAddress: info.remote.address,
    userAgent: c.req.header("User-Agent"),
    location: c.req.header("Location"),
    referer: c.req.header("Referer"),
  });

  if (qrCode.type === "url") {
    return c.redirect(qrCode.content);
  }

  return c.text(qrCode.content);
});

export default shortUrlRoute;
