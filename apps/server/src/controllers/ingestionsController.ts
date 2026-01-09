import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import pool from "../config/database.js";
import { ensureUserExists } from "../utils/ensureUser.js";
import { processIngestionJob } from "../services/ingestionService.js";

export const createIngestionJob = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const { listId, url } = req.body || {};

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await ensureUserExists(userId);

    if (!listId || !url) {
      return res.status(400).json({ error: "List ID and URL are required" });
    }

    const listCheck = await pool.query(
      "SELECT id FROM lists WHERE id = $1 AND user_id = $2",
      [listId, userId],
    );

    if (listCheck.rows.length === 0) {
      return res.status(404).json({ error: "List not found" });
    }

    const insertResult = await pool.query(
      `
        INSERT INTO ingestion_jobs (list_id, user_id, url, status, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        RETURNING id, status
      `,
      [listId, userId, url, "queued"],
    );

    const job = insertResult.rows[0];
    setImmediate(() => {
      void processIngestionJob(job.id);
    });

    return res.status(201).json({ jobId: job.id, status: job.status });
  } catch (error) {
    console.error("Error creating ingestion job:", error);
    return res.status(500).json({ error: "Failed to create ingestion job" });
  }
};

export const getIngestionJob = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await ensureUserExists(userId);

    const jobResult = await pool.query(
      `
        SELECT id, status, item_id, error
        FROM ingestion_jobs
        WHERE id = $1 AND user_id = $2
      `,
      [id, userId],
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: "Ingestion job not found" });
    }

    const job = jobResult.rows[0];
    return res.json({
      jobId: job.id,
      status: job.status,
      itemId: job.item_id,
      error: job.error,
    });
  } catch (error) {
    console.error("Error fetching ingestion job:", error);
    return res.status(500).json({ error: "Failed to fetch ingestion job" });
  }
};

