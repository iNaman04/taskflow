import { z } from "zod";

export const createJobSchema = z.object({
    type: z.enum(["DEMO"]),

    payload: z.object({
        message: z.string().min(1, "Message is required"),
    }),

    priority: z.number().int().min(1).max(10).optional(),
});