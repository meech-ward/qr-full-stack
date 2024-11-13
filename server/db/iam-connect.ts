import { Signer } from "@aws-sdk/rds-signer";
import mysql from "mysql2/promise";

export async function generateIamToken({
  host,
  user,
  region,
}: {
  host: string;
  user: string;
  region: string;
}) {
  const signer = new Signer({
    hostname: host,
    port: 3306,
    username: user,
    region: region || "us-east-1",
  });

  return await signer.getAuthToken();
}

export async function connectWithIamToken({
  host,
  user,
  token,
  database,
}: {
  host: string;
  user: string;
  token: () => Promise<string>;
  database: string;
}) {
  const connection = await mysql.createPool({
    host,
    user,
    database,
    insecureAuth: true,
    idleTimeout: 1000,
    ssl: "Amazon RDS",
    authPlugins: {
      mysql_clear_password: () => async () => {
        const t = await token();
        return Buffer.from(t + '\0')
      }
    }
  });

  return connection;
}
