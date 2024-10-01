import app from "./app";
import { z } from "zod";
import { logger } from "./lib/logger";

const ServeEnv = z.object({
  PORT: z
    .string()
    .regex(/^\d+$/, "Port must be a numeric string")
    .default("3000")
    .transform(Number),
});
const ProcessEnv = ServeEnv.parse(process.env);

const server = Bun.serve({
  port: ProcessEnv.PORT,
  hostname: "0.0.0.0", // Explicitly bind to all interfaces
  fetch: app.fetch,
});

logger.info(`Server running on:`);
logger.info(`- Local:   http://localhost:${server.port}`);
logger.info(`- Network: http://${Bun.env.HOST || '0.0.0.0'}:${server.port}`);
