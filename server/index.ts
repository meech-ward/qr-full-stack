import app from "./app";
import { z } from "zod";

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

console.log(`Server running on:`);
console.log(`- Local:   http://localhost:${server.port}`);
console.log(`- Network: http://${Bun.env.HOST || '0.0.0.0'}:${server.port}`);