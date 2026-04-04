// controllers/subscriptionController.js
import pool from "../config/db.js";
import dotenv from "dotenv";
import Stripe from "stripe";
import { stripePrices } from "../config/stripe.js";

console.log("Stripe Key:", process.env.STRIPE_SECRET_KEY ? "SET" : "MISSING");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  const { activity, duration } = req.body;
  const userId = req.user.id;

  if (!activity || !duration) {
    return res.status(400).json({ message: "Missing activity or duration." });
  }

  const priceId = stripePrices[activity];
  if (!priceId) {
    return res.status(400).json({ message: "Invalid subscription activity." });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: req.user.email,
      metadata: { userId, activity, duration },
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    // This will send the real Stripe error (like "Price ID not found" or "Invalid key") to your console
    console.error("Stripe Checkout Error:", err);

    // Send the actual message back to the frontend instead of the generic one
    res.status(500).json({
      message: "Stripe Error",
      details: err.message || "Unknown error",
    });
  }
};

// Create one or multiple subscriptions
export const createSubscriptions = async (req, res) => {
  const { subscriptions } = req.body; // Expecting an array of objects
  const userId = req.user.id;

  if (!subscriptions || !Array.isArray(subscriptions)) {
    return res.status(400).json({ message: "subscriptions must be an array" });
  }

  try {
    const inserted = [];
    for (let sub of subscriptions) {
      // Destructure
      const { activity, duration } = sub;

      // 2. Calculate the end_date based on the duration
      const start_date = new Date();
      let end_date = new Date(start_date);
      end_date.setMonth(end_date.getMonth() + parseInt(duration));

      // 3. Insert statement

      const result = await pool.query(
        `INSERT INTO public.subscriptions (
           user_id, activity, duration, start_date, end_date, stripe_sub_id, origin, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`, // Returning * gives you all 10 columns back
        [
          userId,
          activity,
          duration,
          start_date,
          end_date,
          null, // stripe_sub_id
          "manual", // origin
          "active", // status
        ]
      );

      inserted.push(result.rows[0]);
    }

    res.status(201).json({ subscriptions: inserted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// ------------------- STRIPE WEBHOOK -------------------
export const webhookHandler = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("✅ Webhook: checkout.session.completed", session.id);

    try {
      const userId = session.metadata.userId;
      const activity = session.metadata.activity;
      const duration = session.metadata.duration;
      // Capture the Stripe subscription ID for future reference (like cancellations)
      const stripeSubId = session.subscription;

      const start_date = new Date();
      const end_date = new Date(start_date);
      end_date.setMonth(end_date.getMonth() + parseInt(duration));

      // Updated Query with all 10 columns
      await pool.query(
        `INSERT INTO public.subscriptions (
           user_id, activity, duration, start_date, end_date, stripe_sub_id, origin, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          activity,
          duration,
          start_date,
          end_date,
          stripeSubId, // Now we store the actual Stripe ID
          "stripe", // origin is 'stripe' so you know it came from a payment
          "active", // default status
        ]
      );

      console.log(
        `Subscription successfully recorded for user ${userId} via Stripe`
      );
    } catch (err) {
      console.error("❌ Failed to insert subscription from webhook:", err);
    }
  }

  res.status(200).json({ received: true });
};

// Get all subscriptions for logged-in user
export const getUserSubscriptions = async (req, res) => {
  const userId = req.user.id;

  try {
    // We simply select all columns.
    // Since we are storing 'status' directly in the DB,
    // no need for complex SQL logic anymore.
    const result = await pool.query(
      `SELECT id, activity, duration, start_date, end_date, 
              stripe_sub_id, origin, status 
       FROM public.subscriptions
       WHERE user_id = $1
       ORDER BY start_date DESC`,
      [userId]
    );

    res.status(200).json({ subscriptions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Cancel a subscription
export const cancelSubscription = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // 1. UPDATE instead of DELETE
    // We update the status, and ensure the user owns the subscription
    const result = await pool.query(
      `UPDATE subscriptions 
       SET status = 'canceled' 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.status(200).json({
      message: "Subscription canceled",
      subscription: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// ------------------ ADMIN FUNCTIONS ------------------

// Get all subscriptions (admin only)
export const getAllSubscriptions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id, s.user_id, u.name, u.email, 
        s.activity, s.duration, s.start_date, s.end_date,
        s.stripe_sub_id, s.origin, s.status
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Cnacel any subscription (admin only)
export const cancelSubscriptionByAdmin = async (req, res) => {
  const { id } = req.params;
  const subscriptionId = parseInt(id, 10);

  if (isNaN(subscriptionId)) {
    return res.status(400).json({ message: "Invalid subscription ID" });
  }

  try {
    const result = await pool.query(
      "UPDATE subscriptions SET status = 'canceled' WHERE id = $1 RETURNING *",
      [subscriptionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.status(200).json({
      message: "Subscription status updated to canceled",
      subscription: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
