import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { z } from 'zod';
import { logger } from '../lib/logger';

const DbEnv = z.object({
  MYSQL_URL: z.string().url(),
});

const ProcessEnv = DbEnv.parse(process.env);

const connection = mysql.createPool(ProcessEnv.MYSQL_URL);
const db = drizzle(connection);

logger.info('Database initialized: MySQL');

export { db };
