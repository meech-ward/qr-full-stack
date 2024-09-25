import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { z } from 'zod';

const DbEnv = z.object({
  MYSQL_URL: z.string().url(),
});

const ProcessEnv = DbEnv.parse(process.env);

const connection = mysql.createPool(ProcessEnv.MYSQL_URL);
const db = drizzle(connection);

console.log('Database initialized: MySQL');

export { db };
