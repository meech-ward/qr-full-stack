import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { z } from "zod";
import { logger } from "../lib/logger";
import { type Logger } from "drizzle-orm/logger";

const DbEnv = z.object({
  MYSQL_URL: z.string().url(),
});

class MyLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    logger.info({ query, params });
  }
}

const ProcessEnv = DbEnv.parse(process.env);

const connection = mysql.createPool(ProcessEnv.MYSQL_URL);

const db = drizzle(connection, { logger: new MyLogger() });

logger.info("Database initialized: MySQL");

export { db };
