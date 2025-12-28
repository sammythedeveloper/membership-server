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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// Allowlist for CORS
const allowedOrigins = [
  "http://localhost:3000",            // for local testing
  "https://membership-client.vercel.app" // your deployed frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman or server-to-server)
      if (!origin) return callback(null, true);
      if (!allowedOrigins.includes(origin)) {
        return callback(new Error(`CORS policy: Access from origin ${origin} is not allowed`), false);
      }
      return callback(null, true);
    },
    credentials: true, // allow cookies/auth headers if needed
  })
);


// ----------------------
// 1️⃣ Stripe webhook route MUST be **before** express.json()
// ----------------------
app.post(
  "/api/subscription/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    console.log("RAW body received from Stripe:", req.body.toString());
    next();
  },
  webhookHandler
);


// ----------------------
// 2️⃣ JSON parsing for everything else
// ----------------------
app.use(express.json());

// Auth & Subscription routes
app.use("/api/auth", authRoutes);
app.use("/api/subscription", subscriptionRoutes);

// Test DB connection
pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error(err));

// Protected route
app.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "You accessed a protected route!", user: req.user });
});

// Admin-only route
app.get("/admin-protected", verifyToken, requireAdmin, (req, res) => {
  res.json({ message: "Welcome Admin!", user: req.user });
});
console.log("✅ About to start server");

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
