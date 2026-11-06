import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
    userId: string;
}

declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
}

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token missing"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            JWT_SECRET
        ) as JwtPayload;

        req.userId = decoded.userId;

        next();

    } catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};