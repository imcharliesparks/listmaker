import dotenv from "dotenv";
import { Pool, PoolConfig } from "pg";

dotenv.config();

const sslConfig =
  process.env.DB_SSL === "false"
    ? undefined
    : { rejectUnauthorized: false };

const poolConfig: PoolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig ?? { rejectUnauthorized: false },
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
