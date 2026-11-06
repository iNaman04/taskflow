import { Request, Response } from "express";
import {
    registerUser,
    loginUser
} from "./auth.service";

import {
    registerSchema,
    loginSchema
} from "./auth.validation";

import prisma from "../../config/db";

export const register = async (
    req: Request,
    res: Response
) => {
    try {
        const validatedData = registerSchema.parse(req.body);

        const result = await registerUser(validatedData);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: result
        });

    } catch (error: any) {

        if (error.name === "ZodError") {
            return res.status(400).json({
                success: false,
                message: "Invalid input",
                errors: error.issues
            });
        }

        if (error.message === "User already exists") {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const login = async (
    req: Request,
    res: Response
) => {
    try {
        const validatedData = loginSchema.parse(req.body);

        const result = await loginUser(
            validatedData.email,
            validatedData.password
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: result
        });

    } catch (error: any) {

        if (error.name === "ZodError") {
            return res.status(400).json({
                success: false,
                message: "Invalid input",
                errors: error.issues
            });
        }

        if (error.message === "Invalid email or password") {
            return res.status(401).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};



export const getMe = async (
    req: Request,
    res: Response
) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: req.userId
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: user
        });

    } catch {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};