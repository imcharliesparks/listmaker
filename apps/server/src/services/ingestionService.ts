import pool from "../config/database.js";
import urlMetadataService from "./urlMetadataService.js";

const STATUS_QUEUED = "queued";
const STATUS_PROCESSING = "processing";
const STATUS_COMPLETED = "completed";
const STATUS_FAILED = "failed";

export async function processIngestionJob(jobId: number) {
  const jobResult = await pool.query(
    "SELECT * FROM ingestion_jobs WHERE id = $1",
    [jobId],
  );

  if (jobResult.rows.length === 0) {
    return;
  }

  const job = jobResult.rows[0];

  if (job.status !== STATUS_QUEUED) {
    return;
  }

  try {
    await pool.query(
      "UPDATE ingestion_jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [STATUS_PROCESSING, jobId],
    );

    const listCheck = await pool.query(
      "SELECT id FROM lists WHERE id = $1 AND user_id = $2",
      [job.list_id, job.user_id],
    );

    if (listCheck.rows.length === 0) {
      throw new Error("List not found");
    }

    const metadata = await urlMetadataService.extractMetadata(job.url);

    if (!metadata.thumbnail && !metadata.videoUrl) {
      throw new Error("Missing required media (image or video)");
    }

    const positionResult = await pool.query(
      "SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM items WHERE list_id = $1",
      [job.list_id],
    );
    const nextPosition = positionResult.rows[0].next_position as number;

    const insertResult = await pool.query(
      `
        INSERT INTO items (list_id, url, title, description, thumbnail_url, video_url, source_type, metadata, position)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `,
      [
        job.list_id,
        metadata.url,
        metadata.title ?? null,
        metadata.description ?? null,
        metadata.thumbnail ?? null,
        metadata.videoUrl ?? null,
        metadata.sourceType ?? null,
        metadata.metadata ?? null,
        nextPosition,
      ],
    );

    const itemId = insertResult.rows[0]?.id as number | undefined;

    await pool.query(
      `
        UPDATE ingestion_jobs
        SET status = $1,
            source_type = $2,
            metadata = $3,
            item_id = $4,
            error = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `,
      [STATUS_COMPLETED, metadata.sourceType ?? null, metadata.metadata ?? null, itemId, jobId],
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingestion failed";
    await pool.query(
      `
        UPDATE ingestion_jobs
        SET status = $1,
            error = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `,
      [STATUS_FAILED, message, jobId],
    );
  }
}

