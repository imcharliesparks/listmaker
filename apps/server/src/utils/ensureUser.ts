import { clerkClient } from "@clerk/express";
import pool from "../config/database.js";

export async function ensureUserExists(userId: string) {
  // Try to find existing user
  const existing = await pool.query("SELECT email FROM users WHERE id = $1", [userId]);
  if (existing.rows.length > 0 && existing.rows[0].email) {
    return existing.rows[0].email as string;
  }

  // Fetch from Clerk
  const clerkUser = await clerkClient.users.getUser(userId);
  const primaryEmail = clerkUser.emailAddresses.find(
    (addr) => addr.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress;
  const fallbackEmail = clerkUser.emailAddresses[0]?.emailAddress;
  const email = primaryEmail || fallbackEmail;

  if (!email) {
    throw new Error("User email not available");
  }

  await pool.query(
    `
      INSERT INTO users (id, email, display_name, photo_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id)
      DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(EXCLUDED.display_name, users.display_name),
        photo_url = COALESCE(EXCLUDED.photo_url, users.photo_url),
        updated_at = CURRENT_TIMESTAMP
    `,
    [userId, email, clerkUser.fullName, clerkUser.imageUrl],
  );

  return email;
}
