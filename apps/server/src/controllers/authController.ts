import { Request, Response } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import pool from "../config/database.js";

export const syncUser = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const { displayName, photoUrl } = req.body || {};

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch email from Clerk to ensure we always have a primary email
    const clerkUser = await clerkClient.users.getUser(userId);
    const primaryEmail = clerkUser.emailAddresses.find(
      (addr) => addr.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress;
    const fallbackEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const email = primaryEmail || fallbackEmail;

    if (!email) {
      return res.status(400).json({ error: "User email not available" });
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

    const result = await pool.query(query, [userId, email, displayName, photoUrl]);

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error syncing user:", error);
    return res.status(500).json({ error: "Failed to sync user" });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error getting user:", error);
    return res.status(500).json({ error: "Failed to get user" });
  }
};
