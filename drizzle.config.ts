import { defineConfig } from 'drizzle-kit';
import { z } from 'zod';
import { readFileSync } from 'fs';
import path from 'path';
import { getStoredToken } from './token-manager';

const DbEnv = z.object({
  RDS_ENDPOINT: z.string(),
  RDS_IAM_USER: z.string(),
  RDS_REGION: z.string(),
  DATABASE_NAME: z.string(),
  RDS_CA_CERT_PATH: z.string().optional().default(path.join(process.cwd(), 'global-bundle.pem')),
});

export const ProcessEnv = DbEnv.parse(process.env);

// Synchronously get the stored token
const iamToken = getStoredToken();

// Read RDS certificate
let caCert;
try {
  caCert = readFileSync(ProcessEnv.RDS_CA_CERT_PATH, 'utf-8');
} catch (error) {
  console.warn(`Warning: Could not read RDS CA certificate from ${ProcessEnv.RDS_CA_CERT_PATH}`);
}

export default defineConfig({
  schema: "./server/db/schema-mysql/*",
  dialect: 'mysql',

  dbCredentials: {
    host: ProcessEnv.RDS_ENDPOINT,
    user: ProcessEnv.RDS_IAM_USER,
    password: iamToken,
    database: ProcessEnv.DATABASE_NAME,
    ssl: {
      ca: caCert, 
    }
  },
});