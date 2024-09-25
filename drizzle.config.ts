import { defineConfig } from 'drizzle-kit'
export default defineConfig({
  schema: "./server/db/schema-mysql/*",
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.MYSQL_URL!,
  },
  verbose: true,
  strict: true,
})