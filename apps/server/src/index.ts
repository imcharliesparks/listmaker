import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import itemsRoutes from "./routes/items.js";
import listsRoutes from "./routes/lists.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : undefined;

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
