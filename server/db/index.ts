import { drizzle } from "drizzle-orm/mysql2";
import { z } from "zod";
import { logger } from "../lib/logger";
import { type Logger } from "drizzle-orm/logger";
import { connectWithIamToken, generateIamToken } from "./iam-connect";


class MyLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    logger.info({ query, params });
  }
}

const DbEnv = z.object({
  RDS_ENDPOINT: z.string(),
  RDS_IAM_USER: z.string(),
  RDS_REGION: z.string(),
  DATABASE_NAME: z.string(),
});

export const ProcessEnv = DbEnv.parse(process.env);

const iamToken = async () =>
  await generateIamToken({
    host: ProcessEnv.RDS_ENDPOINT,
    user: ProcessEnv.RDS_IAM_USER,
    region: ProcessEnv.RDS_REGION,
  });

const connection = await connectWithIamToken({
  host: ProcessEnv.RDS_ENDPOINT,
  user: ProcessEnv.RDS_IAM_USER,
  token: iamToken,
  database: ProcessEnv.DATABASE_NAME,
});

const db = drizzle(connection, { logger: new MyLogger() });

logger.info("Database initialized: MySQL");

export { db };
