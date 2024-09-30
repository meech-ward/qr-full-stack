import { promises as fs } from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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
export const base64OutputHandler: OutputHandler = async ({
  buffer,
  name,
  blend,
}) => {
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
    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, name);
    await fs.writeFile(filePath, buffer);
    return { name, blend, url: `/api/${filePath}` };
  };
};

// S3 Output Handler
export const s3OutputHandler = (s3Config: {
  bucketName: string;
  folder?: string;
  region?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}): OutputHandler => {
  const s3Client = new S3Client({
    region: s3Config.region || "us-east-1",
    credentials: s3Config.credentials,
  });

  return async ({ buffer, name, blend }) => {
    const key = s3Config.folder ? `${s3Config.folder}/${name}` : name;
    const command = new PutObjectCommand({
      Bucket: s3Config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: "image/webp",
    });
    await s3Client.send(command);
    const url = `https://${s3Config.bucketName}.s3.amazonaws.com/${key}`;
    return { name, blend, url };
  };
};