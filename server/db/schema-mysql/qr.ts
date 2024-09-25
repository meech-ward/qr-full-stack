import { text, mysqlTable, int, index, timestamp, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from "zod";

export const qrCodes = mysqlTable(
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

export const qrImages = mysqlTable(
  "qr_images",
  {
    id: varchar("id", { length: 10 }).primaryKey(),
    qrCodeId: varchar("qr_code_id", { length: 10 }).notNull().references(() => qrCodes.id),
    imageName: text("image_name").notNull(),
    filter: text("filter").notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  (qrImages) => {
    return {
      qrCodeIdIndex: index("qr_code_id_idx").on(qrImages.qrCodeId),
    };
  }
);

export const qrUses = mysqlTable(
  "qr_uses",
  {
    id: int("id").autoincrement().primaryKey(),
    qrId: varchar("qr_id", { length: 10 }).notNull().references(() => qrCodes.id),
    scannedAt: timestamp('scanned_at').defaultNow(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    location: text("location"),
    referer: text("referer")
  },
  (qrUses) => {
    return {
      qrIdIndex: index("qr_id_idx").on(qrUses.qrId),
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