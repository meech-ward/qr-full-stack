import { promises as fs } from "fs";
import path from "path";
import { logger } from "../lib/logger";
import { uploadToS3, type S3Config } from "../lib/s3";

export type ImageDetails = {
  name: string;
  blend: string;
  url: string;
};

// Define the type for the output handler
type OutputHandler = (options: {
  buffer: Buffer;
  name: string;
  blend: string;
}) => Promise<ImageDetails>;

// Base64 Output Handler
export const base64OutputHandler = (): OutputHandler => async ({
  buffer,
  name,
  blend,
}) => {
  logger.info(`Base64 Output Handler: name: ${name}, blend: ${blend}`);
  const mimeType = "image/webp";
  const base64Url = `data:${mimeType};base64,${buffer.toString("base64")}`;
  return { name, blend, url: base64Url };
};

// Local File Output Handler
export const localFileOutputHandler = (
  uploadsDir: string
): OutputHandler => {
  // Ensure the uploads directory exists
  return async ({ buffer, name, blend }) => {
    logger.info(`Local File Output Handler: name: ${name}, blend: ${blend}`);
    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, name);
    await fs.writeFile(filePath, buffer);
    return { name, blend, url: `/api/${filePath}` };
  };
};

// S3 Output Handler
export const s3OutputHandler = (s3Config: S3Config): OutputHandler => {
  return async ({ buffer, name, blend }) => {
    logger.info(`S3 Output Handler: name: ${name}, blend: ${blend}`);
    const url = await uploadToS3(buffer, name, s3Config);
    return { name, blend, url };
  };
};