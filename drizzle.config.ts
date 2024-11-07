import { defineConfig } from 'drizzle-kit'
import { z } from 'zod'
import { connectWithIamToken, generateIamToken } from './server/db/iam-connect';
const DbEnv = z.object({
  RDS_ENDPOINT: z.string(),
  RDS_IAM_USER: z.string(),
  RDS_REGION: z.string(),
  DATABASE_NAME: z.string(),
});

export const ProcessEnv = DbEnv.parse(process.env);

const iamToken = await generateIamToken({
  host: ProcessEnv.RDS_ENDPOINT,
  user: ProcessEnv.RDS_IAM_USER,
  region: ProcessEnv.RDS_REGION,
});

export default defineConfig({
  schema: "./server/db/schema-mysql/*",
  dialect: 'mysql',
  dbCredentials: {
    host: ProcessEnv.RDS_ENDPOINT,
    user: ProcessEnv.RDS_IAM_USER,
    password: iamToken,
    database: ProcessEnv.DATABASE_NAME,
  },
  verbose: true,
  strict: true,
})