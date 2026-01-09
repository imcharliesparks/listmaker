import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clerkMiddleware } from "@clerk/express";
import authRoutes from "./routes/auth.js";
import itemsRoutes from "./routes/items.js";
import listsRoutes from "./routes/lists.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from repo root (cwd is apps/server during turbo)
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config(); // fallback to package-local .env if present

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : undefined;

app.use(clerkMiddleware());
app.use(
  cors({
    origin: corsOrigins || true,
    credentials: true,
  }),
);

app.use(express.json());

if (!process.env.DISABLE_HELMET) {
  app.use(helmet());
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/lists", listsRoutes);
app.use("/api/items", itemsRoutes);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);

  if (process.env.NODE_ENV === "development") {
    return res.status(500).json({ error: "Something went wrong", details: err });
  }

  return res.status(500).json({ error: "Something went wrong" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
