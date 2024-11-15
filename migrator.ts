import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db, connection } from './server/db';
import { mightFail } from 'might-fail';
import { logger } from './server/lib/logger';

const [error, result] = await mightFail(migrate(db, { migrationsFolder: './drizzle' }));
if (error) {
  logger.error(error);
} else {
  logger.info(result);
}

logger.info("Migration complete");

await connection.end();