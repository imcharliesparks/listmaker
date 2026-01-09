import { Response } from "express";
import pool from "../config/database.js";
import { AuthRequest } from "../types/index.js";

export const syncUser = async (req: AuthRequest, res: Response) => {
  try {
    const { uid, email } = req.user || {};
    const { displayName, photoUrl } = req.body || {};

    if (!uid || !email) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const query = `
      INSERT INTO users (id, email, display_name, photo_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) 
      DO UPDATE SET 
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        photo_url = EXCLUDED.photo_url,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await pool.query(query, [uid, email, displayName, photoUrl]);

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error syncing user:", error);
    return res.status(500).json({ error: "Failed to sync user" });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.user || {};

    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [uid]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error getting user:", error);
    return res.status(500).json({ error: "Failed to get user" });
  }
};
