import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createIngestionJob,
  getIngestionJob,
} from "../controllers/ingestionsController.js";

const router = Router();

router.use(authenticate);
router.post("/", createIngestionJob);
router.get("/:id", getIngestionJob);

export default router;
