import { z } from "zod";

export const registerSchema = z.object({
    name: z.string()
        .min(2, "Name must contain at least 2 characters"),

    email: z.string()
        .email("Invalid email address"),

    password: z.string()
        .min(8, "Password must contain at least 8 characters")
});

export const loginSchema = z.object({
    email: z.string()
        .email("Invalid email address"),

    password: z.string()
        .min(1, "Password is required")
});