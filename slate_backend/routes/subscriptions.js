// routes/subscription.js
import express from "express";
import {
  createSubscriptions,
  getUserSubscriptions,
  cancelSubscription,
  getAllSubscriptions,
  cancelSubscriptionByAdmin,
  createCheckoutSession
} from "../controllers/subscriptionController.js";

import { verifyToken, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// User routes
router.post("/", verifyToken, createSubscriptions);
router.post("/checkout", verifyToken, createCheckoutSession); 
router.get("/", verifyToken, getUserSubscriptions);
router.delete("/:id", verifyToken, cancelSubscription);

// Stripe webhook route (no auth needed)
// router.post("/webhook", express.raw({ type: "application/json" }), webhookHandler);



// Admin routes
router.get("/all", verifyToken, requireAdmin, getAllSubscriptions);
router.delete("/delete/:id", verifyToken, requireAdmin, cancelSubscriptionByAdmin);

export default router;
