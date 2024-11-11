import {
  CloudWatchLogsClient,
  GetLogEventsCommand,
  DescribeLogStreamsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { logger } from "../logger";

import { readFile } from "fs/promises";
import { join } from "path";

const CONFIG_PATH = "/opt/aws/amazon-cloudwatch-agent/bin/config.json";

export type CloudWatchAgentConfig = {
  agent: {
    metrics_collection_interval: number;
    run_as_user: string;
  };
  logs: {
    logs_collected: {
      files: {
        collect_list: Array<{
          file_path: string;
          log_group_name: string;
          log_stream_name: string;
          retention_in_days: number;
        }>;
      };
    };
  };
  metrics: {
    metrics_collected: {
      mem: {
        measurement: string[];
      };
      disk: {
        measurement: string[];
        resources: string[];
      };
    };
    aggregation_dimensions: string[][];
  };
};

export async function readConfigFile(): Promise<CloudWatchAgentConfig> {
  try {
    const configContent = await readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(configContent);
  } catch (error) {
    logger.error("Error reading CloudWatch agent config file:", error);
    throw new Error("Failed to read CloudWatch agent configuration");
  }
}

const client = new CloudWatchLogsClient({ region: process.env.BUCKET_REGION });

export async function getRecentLogs({instanceId}: {instanceId: string}) {
  const config = await readConfigFile();
  const logGroupName = config.logs.logs_collected.files.collect_list[0].log_group_name;
  const logStreamName = config.logs.logs_collected.files.collect_list[0].log_stream_name === "{instance_id}" ? instanceId : config.logs.logs_collected.files.collect_list[0].log_stream_name;
  const command = new GetLogEventsCommand({
    logGroupName,
    logStreamName,
    startFromHead: false,
    limit: 100  // Adjust as needed
  });

  try {
    const response = await client.send(command);
    return response.events;
  } catch (error) {
    console.error("Error fetching CloudWatch logs:", error);
    throw error;
  }
}