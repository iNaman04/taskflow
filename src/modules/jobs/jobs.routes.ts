import { Router } from "express";

import {
    createJob,
    getJobs,
    getJobById,
} from "./jobs.controller";

import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/", authenticate, createJob);
router.get("/", authenticate, getJobs);
router.get("/:id", authenticate, getJobById);

export default router;