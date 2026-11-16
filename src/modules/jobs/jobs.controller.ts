import { Request, Response } from "express";
import { Prisma } from "@prisma/client";

import prisma from "../../config/db";
import { jobQueue } from "../../queues/job.queue";
import { createJobSchema } from "./jobs.validation";

export const createJob = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const validatedData = createJobSchema.parse(req.body);

        // 1. Save job in PostgreSQL
        const job = await prisma.job.create({
            data: {
                userId,
                type: validatedData.type,
                payload: validatedData.payload as Prisma.InputJsonValue,
                priority: validatedData.priority ?? 5,
                maxAttempts: 3,
            },
        });

        try {
            // 2. Add job to BullMQ queue
            await jobQueue.add(
                "execute-job",
                {
                    jobId: job.id,
                    type: job.type,
                    payload: validatedData.payload,
                },
                {
                    jobId: job.id,
                    attempts: job.maxAttempts,
                    backoff: {
                        type: "exponential",
                        delay: 1000,
                    },
                    priority: job.priority,
                    removeOnComplete: 1000,
                    removeOnFail: 5000,
                }
            );
        } catch (queueError) {
            // Queue insertion failed, so reflect that in PostgreSQL.
            await prisma.job.update({
                where: { id: job.id },
                data: {
                    status: "FAILED",
                    errorMessage: "Unable to add job to queue",
                },
            });

            return res.status(503).json({
                message: "Job could not be added to the queue",
                jobId: job.id,
            });
        }

        // 3. Immediately return response
        return res.status(202).json({
            message: "Job submitted successfully",
            job,
        });

    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(error);
        }

        if (error instanceof Error && error.name === "ZodError") {
            return res.status(400).json({
                message: "Invalid job data",
                error: error.message,
            });
        }

        console.error(error);

        return res.status(500).json({
            message: "Failed to create job",
        });
    }
};


export const getJobs = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const jobs = await prisma.job.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return res.status(200).json({
            jobs,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch jobs",
        });
    }
};


export const getJobById = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const jobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const job = await prisma.job.findFirst({
            where: {
                id: jobId,
                userId,
            },
        });

        if (!job) {
            return res.status(404).json({
                message: "Job not found",
            });
        }

        return res.status(200).json({
            job,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch job",
        });
    }
};