import { Signer } from "@aws-sdk/rds-signer";
import mysql from "mysql2/promise";

export async function generateIamToken({host, user, region}: {host: string, user: string, region: string}) {
  const signer = new Signer({
    hostname: host,
    port: 3306,
    username: user,
    region: region || 'us-east-1',
  });

  return await signer.getAuthToken();
}

export async function connectWithIamToken({host, user, token, database}: {host: string, user: string, token: string, database: string}) {
  const connection = await mysql.createPool({
    host,
    user,
    password: token,
    database,
    insecureAuth: true,
    ssl: 'Amazon RDS',
  });

  return connection;
}

