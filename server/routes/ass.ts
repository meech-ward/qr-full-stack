import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import {
  qrCodes as qrCodesTable,
  qrImages as qrImagesTable,
  qrUses as qrUsesTable,
} from "../db/schema-mysql/qr";
import { eq, sql } from "drizzle-orm";
import { getConnInfo } from "hono/bun";
import { readFileSync } from "fs";
import { logger } from "../lib/logger";
import { getServiceName } from "../lib/ass/service";
import { readConfigFile, getRecentLogs } from "../lib/ass/cloudwatch";
import {
  getInstanceId,
  getInstanceType,
  getPrivateIpv4,
  getPublicIpv4,
  getRegion,
  getAvailabilityZone,
  getSecurityGroups,
  getIamRole,
} from "../lib/ass/ec2";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { mightFail } from "might-fail";

async function testS3() {
  const s3Client = new S3Client({
    region: process.env.BUCKET_REGION,
  });

  const key = "tmp-test-file.txt";
  const putCommand = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: key,
    Body: "test text",
    ContentType: "text",
  });
  await s3Client.send(putCommand);

  const getCommand = new GetObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: key,
  });
  const response = await s3Client.send(getCommand);
  const data = await response.Body?.transformToString();

  const deleteCommand = new DeleteObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: key,
  });
  await s3Client.send(deleteCommand);

  return data;
}

export const assRoute = new Hono()
  .get("/service", async (c) => {
    const serviceName = getServiceName();
    return c.json({ serviceName });
  })
  .get("/env-vars", async (c) => {
    const envVars = process.env;
    return c.json({ envVars });
  })
  .get("/cloudwatch-config", async (c) => {
    const config = await readConfigFile();
    return c.json({ config });
  })
  .get("/test-s3", async (c) => {
    const text = await testS3();
    return c.json({ text });
  })
  .get("/test-db", async (c) => {
    const [basicQueryError, basicQueryResult] = await mightFail(
      db.execute(sql`select now() as time;`)
    );
    if (basicQueryError) {
      logger.error(basicQueryError);
      return c.json({ error: basicQueryError.message }, 500);
    }
    const [qrQueryError, qrQueryResult] = await mightFail(
      db.select().from(qrCodesTable)
    );
    if (qrQueryError) {
      logger.error(qrQueryError);
      return c.json({ basicQueryResult: basicQueryResult[0], error: qrQueryError.message });
    }
    return c.json({ basicQueryResult: basicQueryResult[0], qrQueryResult });
  })
  .get("/instance-id", async (c) => {
    const instanceId = await getInstanceId();
    return c.json({ instanceId });
  })
  .get("/instance-type", async (c) => {
    const instanceType = await getInstanceType();
    return c.json({ instanceType });
  })
  .get("/private-ipv4", async (c) => {
    const privateIpv4 = await getPrivateIpv4();
    return c.json({ privateIpv4 });
  })
  .get("/public-ipv4", async (c) => {
    const publicIpv4 = await getPublicIpv4();
    return c.json({ publicIpv4 });
  })
  .get("/region", async (c) => {
    const region = await getRegion();
    return c.json({ region });
  })
  .get("/availability-zone", async (c) => {
    const availabilityZone = await getAvailabilityZone();
    return c.json({ availabilityZone });
  })
  .get("/security-groups", async (c) => {
    const securityGroups = await getSecurityGroups();
    return c.json({ securityGroups });
  })
  .get("/iam-role", async (c) => {
    const iamRole = await getIamRole();
    return c.json({ iamRole });
  });

export default assRoute;
