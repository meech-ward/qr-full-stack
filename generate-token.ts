import { getOrGenerateToken } from "./token-manager";
import { z } from "zod";
const DbEnv = z.object({
  RDS_ENDPOINT: z.string(),
  RDS_IAM_USER: z.string(),
  RDS_REGION: z.string(),
  DATABASE_NAME: z.string(),
});

export const ProcessEnv = DbEnv.parse(process.env);
const token = await getOrGenerateToken({
  host: ProcessEnv.RDS_ENDPOINT,
  user: ProcessEnv.RDS_IAM_USER,
  region: ProcessEnv.RDS_REGION,
});