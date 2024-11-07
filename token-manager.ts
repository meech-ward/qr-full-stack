import path from "path";
import { generateIamToken } from "./server/db/iam-connect";
import { readFileSync } from 'bun:fs';

const TOKEN_FILE = path.join(process.cwd(), ".iam-token");
const TOKEN_EXPIRY_FILE = path.join(process.cwd(), ".iam-token-expiry");

// IAM tokens are valid for 15 minutes
const TOKEN_VALIDITY_MS = 14 * 60 * 1000; // 14 minutes in milliseconds

export async function getOrGenerateToken(config: {
  host: string;
  user: string;
  region: string;
}): Promise<string> {
  try {
    const [token, expiry] = await Promise.all([
      Bun.file(TOKEN_FILE).text(),
      Bun.file(TOKEN_EXPIRY_FILE).text(),
    ]);

    const expiryTime = parseInt(expiry);
    if (Date.now() < expiryTime) {
      return token;
    }
  } catch (error) {
    // Files don't exist or are invalid, continue to generate new token
  }

  // Generate new token
  const token = await generateIamToken(config);
  const expiry = Date.now() + TOKEN_VALIDITY_MS;

  // Save token and expiry using Bun.write
  await Promise.all([
    Bun.write(TOKEN_FILE, token),
    Bun.write(TOKEN_EXPIRY_FILE, expiry.toString()),
  ]);

  return token;
}

export function getStoredToken(): string {
  try {
    const token = readFileSync(TOKEN_FILE, "utf-8");
    console.log({ token });
    return token;
  } catch (error) {
    console.log(error)
    throw new Error(
      "IAM token not found. Run your application first to generate the token."
    );
  }
}
