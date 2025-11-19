// import express from 'express';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import authRoutes from './routes/auth.js';
// import pool from './config/db.js'; // make sure you have db connection
// import { verifyToken, requireAdmin } from "./middleware/authMiddleware.js";
// import subscriptionRoutes from "./routes/subscriptions.js";
// import { webhookHandler } from "./controllers/subscriptionController.js";


// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5001;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Routes
// app.post('/test', (req, res) => {
//     console.log('Test route hit!', req.body);
//     res.json({ message: 'Test successful', data: req.body });
// });
// // For webhook, use raw body
// app.post(
//   "/api/subscription/webhook",
//   express.raw({ type: "application/json" }),
//   webhookHandler
// );

// app.use('/api/auth', authRoutes);
// app.use("/api/subscription", subscriptionRoutes);

// // Test DB connection
// pool.connect()
//     .then(() => console.log('✅ Connected to PostgreSQL'))
//     .catch(err => console.error(err));

// // Start server
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// // Protected route (user must be logged in)
// app.get("/protected", verifyToken, (req, res) => {
//     res.json({ message: "You accessed a protected route!", user: req.user });
// });
  
  
//   // Admin-only route
//   app.get("/admin-protected", verifyToken, requireAdmin, (req, res) => {
//     res.json({ message: "Welcome Admin!", user: req.user });
//   });
  
  
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

// CORS middleware
app.use(cors());

// Stripe Webhook: RAW body must come **before** express.json()
app.post(
  "/api/subscription/webhook",
  express.raw({ type: "application/json" }),
  webhookHandler
);

// Other routes: JSON body parsing
app.use(express.json());

// Auth & Subscription routes
app.use("/api/auth", authRoutes);
app.use("/api/subscription", subscriptionRoutes);

// Test DB connection
pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch(err => console.error(err));

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Protected route
app.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "You accessed a protected route!", user: req.user });
});

// Admin-only route
app.get("/admin-protected", verifyToken, requireAdmin, (req, res) => {
  res.json({ message: "Welcome Admin!", user: req.user });
});
