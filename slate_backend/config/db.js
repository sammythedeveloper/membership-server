// import pkg from "pg";
// import dotenv from "dotenv";
// dotenv.config();
// const { Pool } = pkg;
// const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// pool
//   .connect()
//   .then(() => console.log("✅ Connected to PostgreSQL"))
//   .catch((err) => console.error("❌ Connection error", err));
// export default pool;


import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export default pool;
