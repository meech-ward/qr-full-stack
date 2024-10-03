import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import {
  qrCodes as qrCodesTable,
  qrImages as qrImagesTable,
  qrUses as qrUsesTable,
} from "../db/schema-mysql/qr";
import { eq } from "drizzle-orm";
import { getConnInfo } from 'hono/bun'
import { readFileSync } from 'fs';
import { logger } from "../lib/logger";


export const assRoute = new Hono().get("/service", async (c) => {
  const serviceName = getServiceName();

  return c.json({ serviceName });
}).get("/env-vars", async (c) => { 
  const envVars = process.env;
  return c.json({ envVars });
});

export default assRoute;


function getServiceName() {
    try {
        // Read the cgroup file
        const cgroupContent = readFileSync('/proc/self/cgroup', 'utf8');
        const lines = cgroupContent.split('\n');

        // Look for possible systemd entries in different hierarchies
        for (let line of lines) {
            if (line.includes('systemd')) {
                const parts = line.split('/');
                const serviceName = parts.pop();
                if (serviceName) {
                    return serviceName.replace('.service', '');
                }
            }
        }

        // Additional fallback: check all lines for any service name ending in ".service"
        for (let line of lines) {
            const match = line.match(/\.service$/);
            if (match) {
                const parts = line.split('/');
                return parts.pop()?.replace('.service', '') || null;
            }
        }
    } catch (error) {
        logger.error('Could not determine service name:', error);
    }

    return null;
}