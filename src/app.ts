import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "TaskFlow API is running"
    });
});

app.use("/api/auth", authRoutes);


export default app;