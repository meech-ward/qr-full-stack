import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as getSignedUrlPresigner } from "@aws-sdk/s3-request-presigner";
import { logger } from "./logger";

export type S3Config = {
  bucketName: string;
  folder?: string;
  region?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
};

// Singleton S3 client instance
let s3Client: S3Client | null = null;

export function getS3Client(config?: S3Config): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: config?.region || process.env.BUCKET_REGION || "us-east-1",
      credentials: config?.credentials,
    });
  }
  return s3Client;
}

/**
 * Uploads a file to S3
 * @param buffer File buffer to upload
 * @param key S3 object key
 * @param config S3 configuration
 * @returns URL of the uploaded file
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  config: S3Config
): Promise<string> {
  const client = getS3Client(config);
  const fullKey = config.folder ? `${config.folder}/${key}` : key;
  
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: fullKey,
    Body: buffer,
    ContentType: "image/webp",
  });
  
  await client.send(command);
  return `https://${config.bucketName}.s3.amazonaws.com/${fullKey}`;
}

/**
 * Generates a signed URL for an S3 object
 * @param key The S3 object key (path to file in bucket)
 * @param expiresIn Number of seconds until the URL expires (default: 3600)
 * @returns Signed URL string or null if S3 is not configured
 */
export async function getSignedUrl(key: string, expiresIn = 3600): Promise<string | null> {
  const bucketName = process.env.BUCKET_NAME;
  if (!s3Client || !bucketName) {
    logger.error("S3 client or bucket name not configured");
    return null;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrlPresigner(s3Client, command, {
      expiresIn,
    });

    return signedUrl;
  } catch (error) {
    logger.error("Error generating signed URL:", error);
    return null;
  }
} 