// import { insertQrCodeSchema } from "./db/schema-pg/qr";
import { z } from "zod";


export const blends = [
  "multiply-dark",
  "multiply",
  "dark",
  "normal",
  "color-burn",
  "exclusion",
  "hard-light",
] as const;

export type Blend = (typeof blends)[number];


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
  blend: z.enum(blends).optional(),
});

export type CreateQrCode = z.infer<typeof createQrCodeSchema>;


export const createShortUrlSchema = z.object({
  text: z.string(),
});

export type CreateShortUrl = z.infer<typeof createShortUrlSchema>;
