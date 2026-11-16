import { Queue } from "bullmq";
import redisConnection from "../config/redis";

export const JOB_QUEUE_NAME = "taskflow-jobs";

export interface JobQueueData {
    jobId: string;
    type: string;
    payload: Record<string, unknown>;
}

export const jobQueue = new Queue<JobQueueData>(
    JOB_QUEUE_NAME,
    {
        connection: redisConnection,
    }
);