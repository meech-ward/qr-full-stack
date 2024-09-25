// import { insertQrCodeSchema } from "./db/schema-pg/qr";
import { z } from "zod";

// export const createQrCodeSchema = insertQrCodeSchema.omit({
//   createdAt: true,
//   id: true,
// });

// export type CreateQrCode = z.infer<typeof createQrCodeSchema>;

export const createQrCodeSchema = z.object({
  id: z.string().optional(),
  bgImage: z.instanceof(File).optional(),
  qrImage: z.instanceof(File),
  save: z.enum(["true", "false"]),
});

export type CreateQrCode = z.infer<typeof createQrCodeSchema>;


export const createShortUrlSchema = z.object({
  text: z.string(),
});

export type CreateShortUrl = z.infer<typeof createShortUrlSchema>;