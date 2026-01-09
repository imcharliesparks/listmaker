import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool, PoolConfig } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from repo root, then fall back to package-local
dotenv.config({ path: path.resolve(__dirname, "../../../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
dotenv.config();

const sslConfig =
  process.env.DB_SSL === "false"
    ? undefined
    : { rejectUnauthorized: false };

const poolConfig: PoolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig,
    }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: sslConfig,
    };

const pool = new Pool(poolConfig);

pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export default pool;
