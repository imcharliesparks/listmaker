import { createClerkClient, verifyToken } from "@clerk/backend";
import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "../types/index.js";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY || "",
});

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY || "",
    });

    if (!payload?.sub) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userId = payload.sub;
    const user = await clerkClient.users.getUser(userId);

    const email = user.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId,
    )?.emailAddress;

    if (!email) {
      return res.status(401).json({ error: "User email not available" });
    }

    (req as AuthRequest).user = {
      uid: userId,
      email,
    };

    return next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
