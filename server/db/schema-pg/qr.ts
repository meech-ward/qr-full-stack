import { text, pgTable, serial, index, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from "zod";

export const qrCodes = pgTable(
  "qr_codes",
  {
    id: varchar("id", { length: 10 }).primaryKey(),
    content: text("content").notNull(),
    type: varchar("type", { length: 4 }).notNull(),
    createdAt: timestamp('created_at').defaultNow()
  },
  (qrCodes) => {
    return {
      typeIndex: index("type_idx").on(qrCodes.type),
    };
  }
);

export const qrImages = pgTable(
  "qr_images",
  {
    id: varchar("id", { length: 10 }).primaryKey(),
    qrCodeId: varchar("qr_code_id", { length: 10 }).notNull().references(() => qrCodes.id),
    imageName: text("image_name").notNull(),
    createdAt: timestamp('created_at').defaultNow()
  },
  (qrImages) => {
    return {
      qrCodeIdIndex: index("qr_code_id_idx").on(qrImages.qrCodeId),
    };
  }
);

export const qrUses = pgTable(
  "qr_uses",
  {
    id: serial("id").primaryKey(),
    qrImageId: varchar("qr_image_id", { length: 10 }).notNull().references(() => qrImages.id),
    scannedAt: timestamp('scanned_at').defaultNow(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    location: text("location"),
    referer: text("referer")
  },
  (qrUses) => {
    return {
      qrImageIdIndex: index("qr_image_id_idx").on(qrUses.qrImageId),
    };
  }
);

// Schemas for inserting
export const insertQrCodeSchema = createInsertSchema(qrCodes, {
  type: z.enum(['url', 'text']),
  content: z.string().min(1, { message: "Content cannot be empty" }),
  id: z.string().length(10)
});

export const insertQrImageSchema = createInsertSchema(qrImages, {
  imageName: z.string().min(1, { message: "Image name cannot be empty" }),
  id: z.string().length(10)
});

export const insertQrUseSchema = createInsertSchema(qrUses);

// Schemas for selecting
export const selectQrCodeSchema = createSelectSchema(qrCodes);
export const selectQrImageSchema = createSelectSchema(qrImages);
export const selectQrUseSchema = createSelectSchema(qrUses);