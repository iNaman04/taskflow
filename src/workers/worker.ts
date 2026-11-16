import "dotenv/config";

import { Worker, Job as BullJob } from "bullmq";
import { Prisma, JobType } from "@prisma/client";

import prisma from "../config/db";
import redisConnection from "../config/redis";

import {
    JOB_QUEUE_NAME,
    JobQueueData,
} from "../queues/job.queue";

import { processDemoJob } from "./handlers/demo.handler";


const handlers: Record<
    JobType,
    (payload: Record<string, unknown>) => Promise<Record<string, unknown>>
> = {
    DEMO: processDemoJob,
};


const worker = new Worker<JobQueueData>(
    JOB_QUEUE_NAME,

    async (bullJob: BullJob<JobQueueData>) => {
        const { jobId, type, payload } = bullJob.data;

        console.log(`Worker picked up job: ${jobId}`);

        // Update database when processing starts
        await prisma.job.update({
            where: { id: jobId },
            data: {
                status: "PROCESSING",
                attempts: { increment: 1 },
                startedAt: new Date(),
                errorMessage: null,
            },
        });

        try {
            const handler = handlers[type as JobType];

            if (!handler) {
                throw new Error(`Unsupported job type: ${type}`);
            }

            // Execute actual job handler
            const result = await handler(payload);

            // Mark job as completed
            await prisma.job.update({
                where: { id: jobId },
                data: {
                    status: "COMPLETED",
                    completedAt: new Date(),
                    result: result as Prisma.InputJsonValue,
                    errorMessage: null,
                },
            });

            console.log(`Job completed: ${jobId}`);

            return result;

        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";

            const totalAttempts = bullJob.opts.attempts ?? 1;
            const currentAttempt = bullJob.attemptsMade + 1;

            // Only mark as permanently failed after final attempt
            await prisma.job.update({
                where: { id: jobId },
                data: {
                    status:
                        currentAttempt >= totalAttempts
                            ? "FAILED"
                            : "PENDING",
                    errorMessage,
                },
            });

            console.error(`Job failed: ${jobId}`, errorMessage);

            // Throwing tells BullMQ that the attempt failed.
            // BullMQ can then retry according to its configuration.
            throw error;
        }
    },

    {
        connection: redisConnection,
        concurrency: 5,
    }
);


worker.on("completed", (job) => {
    console.log(`BullMQ job completed: ${job.id}`);
});

worker.on("failed", (job, error) => {
    console.error(
        `BullMQ job failed: ${job?.id}`,
        error.message
    );
});

worker.on("error", (error) => {
    console.error("Worker error:", error);
});


console.log("TaskFlow worker is running...");