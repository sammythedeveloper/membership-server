import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import pool from "./config/db.js";
import { verifyToken, requireAdmin } from "./middleware/authMiddleware.js";
import { webhookHandler } from "./controllers/subscriptionController.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// 1. STABILIZE CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Log
        console.error(`CORS Blocked: ${origin}`);
        callback(
          new Error(`CORS policy: Access from origin ${origin} is not allowed`)
        );
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// ----------------------
// 2. Stripe Webhook (MUST come before express.json)
// ----------------------
app.post(
  "/api/subscription/webhook",
  express.raw({ type: "application/json" }),
  webhookHandler
);

// ----------------------
// 3. Global Middleware (JSON parsing for everything else)
// ----------------------
app.use(express.json());

// ----------------------
// 4. Main Routes
// ----------------------
app.use("/api/auth", authRoutes);
app.use("/api/subscription", subscriptionRoutes);

// ----------------------
// 5. Protected/Test Routes
// ----------------------
app.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "You accessed a protected route!", user: req.user });
});

app.get("/admin-protected", verifyToken, requireAdmin, (req, res) => {
  res.json({ message: "Welcome Admin!", user: req.user });
});

// ----------------------
// 6. DB Connection & Server Start
// ----------------------
console.log("✅ Preparing to start server...");

pool
  .connect()
  .then(() => {
    console.log("✅ Connected to PostgreSQL");
    // Only one listen call, and it's at the very end
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  });
