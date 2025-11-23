// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import authRoutes from "./routes/auth.js";
// import subscriptionRoutes from "./routes/subscriptions.js";
// import pool from "./config/db.js";
// import { verifyToken, requireAdmin } from "./middleware/authMiddleware.js";
// import { webhookHandler } from "./controllers/subscriptionController.js";

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5001;

// // Allowlist for CORS
// const allowedOrigins = [
//   "http://localhost:3000", // local frontend
//   process.env.FRONTEND_URL // add your deployed frontend URL in .env as FRONTEND_URL
// ];

// // CORS middleware
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin) return callback(null, true); // allow requests like curl/postman
//       if (allowedOrigins.indexOf(origin) === -1) {
//         const msg = `CORS policy: Access from origin ${origin} is not allowed`;
//         return callback(new Error(msg), false);
//       }
//       return callback(null, true);
//     },
//     credentials: true,
//   })
// );

// // JSON parsing — but DO NOT parse the Stripe webhook route
// app.use((req, res, next) => {
//   if (req.originalUrl === "/api/subscription/webhook") {
//     return next(); // skip express.json() for webhook
//   }
//   express.json()(req, res, next);
// });


// // JSON body parsing
// app.use(express.json());

// // Auth & Subscription routes
// app.use("/api/auth", authRoutes);
// app.use("/api/subscription", subscriptionRoutes);

// // Test DB connection
// pool.connect()
//   .then(() => console.log("✅ Connected to PostgreSQL"))
//   .catch(err => console.error(err));

// // Start server
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// // Protected route
// app.get("/protected", verifyToken, (req, res) => {
//   res.json({ message: "You accessed a protected route!", user: req.user });
// });

// // Admin-only route
// app.get("/admin-protected", verifyToken, requireAdmin, (req, res) => {
//   res.json({ message: "Welcome Admin!", user: req.user });
// });

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

// ----------------------------------------------
// ✅ CORS ALLOWLIST
// ----------------------------------------------
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error(`CORS blocked: ${origin}`), false);
    },
    credentials: true,
  })
);

// ----------------------------------------------
// 🚨 STRIPE WEBHOOK MUST COME *BEFORE* express.json()
// ----------------------------------------------
app.post(
  "/api/subscription/webhook",
  express.raw({ type: "application/json" }),
  webhookHandler
);

// ----------------------------------------------
// 📌 JSON BODY PARSER FOR ALL OTHER ROUTES
// ----------------------------------------------
app.use(express.json());

// ----------------------------------------------
// ROUTES
// ----------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/subscription", subscriptionRoutes);

// ----------------------------------------------
// DB CONNECT TEST
// ----------------------------------------------
pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ PostgreSQL error:", err));

// ----------------------------------------------
// START SERVER
// ----------------------------------------------
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

// ----------------------------------------------
// OPTIONAL PROTECTED ROUTES
// ----------------------------------------------
app.get("/protected", verifyToken, (req, res) => {
  res.json({
    message: "You accessed a protected route!",
    user: req.user,
  });
});

app.get("/admin-protected", verifyToken, requireAdmin, (req, res) => {
  res.json({
    message: "Welcome Admin!",
    user: req.user,
  });
});
