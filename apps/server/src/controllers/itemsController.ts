import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import pool from "../config/database.js";
import urlMetadataService from "../services/urlMetadataService.js";
import { ensureUserExists } from "../utils/ensureUser.js";
import { toJsonbParam } from "../utils/toJsonbParam.js";

export const addItem = async (req: Request, res: Response) => {
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
      "SELECT * FROM lists WHERE id = $1 AND user_id = $2",
      [listId, userId],
    );

    if (listCheck.rows.length === 0) {
      return res.status(404).json({ error: "List not found" });
    }

    const metadata = await urlMetadataService.extractMetadata(url);

    const positionResult = await pool.query(
      "SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM items WHERE list_id = $1",
      [listId],
    );
    const nextPosition = positionResult.rows[0].next_position;

    const query = `
      INSERT INTO items (list_id, url, title, description, thumbnail_url, video_url, source_type, metadata, position)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(query, [
      listId,
      url,
      metadata.title,
      metadata.description,
      metadata.thumbnail,
      metadata.videoUrl,
      metadata.sourceType,
      toJsonbParam(metadata.metadata),
      nextPosition,
    ]);

    return res.status(201).json({ item: result.rows[0] });
  } catch (error) {
    console.error("Error adding item:", error);
    return res.status(500).json({ error: "Failed to add item" });
  }
};

export const getListItems = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const { listId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await ensureUserExists(userId);
    const listCheck = await pool.query(
      "SELECT * FROM lists WHERE id = $1 AND user_id = $2",
      [listId, userId],
    );

    if (listCheck.rows.length === 0) {
      return res.status(404).json({ error: "List not found" });
    }

    const result = await pool.query(
      "SELECT * FROM items WHERE list_id = $1 ORDER BY position ASC",
      [listId],
    );

    return res.json({ items: result.rows });
  } catch (error) {
    console.error("Error getting items:", error);
    return res.status(500).json({ error: "Failed to get items" });
  }
};

export const getItemById = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await ensureUserExists(userId);

    const result = await pool.query(
      `
        SELECT i.*
        FROM items i
        JOIN lists l ON i.list_id = l.id
        WHERE i.id = $1 AND l.user_id = $2
      `,
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    return res.json({ item: result.rows[0] });
  } catch (error) {
    console.error("Error getting item:", error);
    return res.status(500).json({ error: "Failed to get item" });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await ensureUserExists(userId);
    const itemCheck = await pool.query(
      `
       SELECT i.* FROM items i 
       JOIN lists l ON i.list_id = l.id 
       WHERE i.id = $1 AND l.user_id = $2
      `,
      [id, userId],
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    await pool.query("DELETE FROM items WHERE id = $1", [id]);

    return res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    return res.status(500).json({ error: "Failed to delete item" });
  }
};
