// import { insertQrCodeSchema } from "./db/schema-pg/qr";
import { z } from "zod";


const blendsArray = [
  "multiply-dark",
  "multiply",
  "dark",
  "normal",
  "color-burn",
  "exclusion",
  "hard-light",
] as const;
const blendsEnum = z.enum(blendsArray);
export type Blend = z.infer<typeof blendsEnum>;
export const blends = blendsArray as unknown as Blend[];



// export const createQrCodeSchema = insertQrCodeSchema.omit({
//   createdAt: true,
//   id: true,
// });

// export type CreateQrCode = z.infer<typeof createQrCodeSchema>;

export const createQrCodeSchema = z.object({
  id: z.string(),
  bgImage: z.instanceof(File),
  qrImage: z.instanceof(File),
});

export type CreateQrCode = z.infer<typeof createQrCodeSchema>;

export const previewQrCodeSchema = z.object({
  bgImage: z.instanceof(File),
  qrImage: z.instanceof(File),
  blend: blendsEnum.optional(),
});

export type PreviewQrCode = z.infer<typeof previewQrCodeSchema>;


export const createShortUrlSchema = z.object({
  text: z.string(),
});

export type CreateShortUrl = z.infer<typeof createShortUrlSchema>;
