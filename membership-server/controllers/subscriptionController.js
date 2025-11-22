// controllers/subscriptionController.js
import pool from "../config/db.js";
import dotenv from "dotenv";
import Stripe from "stripe";
import { stripePrices } from "../config/stripe.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  const { activity, duration } = req.body; // now duration comes from frontend
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
      success_url: `http://localhost:3000/dashboard?success=true`,
      cancel_url: `http://localhost:3000/cancel`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe Checkout Error:", err);
    res.status(500).json({ message: "Failed to create checkout session." });
  }
};

// Create one or multiple subscriptions
export const createSubscriptions = async (req, res) => {
  const { subscriptions } = req.body; // expect an array of { activity, duration }
  const userId = req.user.id;

  if (!subscriptions || !Array.isArray(subscriptions)) {
    return res.status(400).json({ message: "subscriptions must be an array" });
  }

  try {
    const inserted = [];
    for (let sub of subscriptions) {
      const { activity, duration } = sub;
      const start_date = new Date();
      let end_date = new Date(start_date);

      // calculate end date based on duration (simple logic: '1 month', '3 months')
      const months = parseInt(duration);
      end_date.setMonth(end_date.getMonth() + months);

      const result = await pool.query(
        `INSERT INTO subscriptions (user_id, activity, duration, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, activity, duration, start_date, end_date`,
        [userId, activity, duration, start_date, end_date]
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
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("Received checkout.session.completed event:");
    console.log(session);

    try {
      const userId = session.metadata.userId;
      const activity = session.metadata.activity;
      const duration = session.metadata.duration;

      const start_date = new Date();
      let end_date = new Date(start_date);
      end_date.setMonth(end_date.getMonth() + parseInt(duration));

      await pool.query(
        `INSERT INTO subscriptions (user_id, activity, duration, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, activity, duration, start_date, end_date]
      );

      console.log(
        `Subscription added for user ${userId}, activity: ${activity}`
      );
    } catch (err) {
      console.error("Failed to insert subscription from webhook:", err);
    }
  }

  res.status(200).json({ received: true });
};

// Get all subscriptions for logged-in user
export const getUserSubscriptions = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id, activity, duration, start_date, end_date,
              CASE 
                WHEN CURRENT_DATE <= end_date THEN 'active'
                ELSE 'expired'
              END AS status
       FROM subscriptions
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
    const result = await pool.query(
      `DELETE FROM subscriptions WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res
      .status(200)
      .json({ message: "Subscription canceled", subscription: result.rows[0] });
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
            SELECT s.id, s.user_id, u.name, u.email, s.activity, s.duration, s.start_date, s.end_date
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

// Delete any subscription (admin only)
export const deleteSubscriptionByAdmin = async (req, res) => {
  const { id } = req.params;
  const subscriptionId = parseInt(id, 10); // <-- parse to integer

  if (isNaN(subscriptionId)) {
    return res.status(400).json({ message: "Invalid subscription ID" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM subscriptions WHERE id = $1 RETURNING *",
      [subscriptionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res
      .status(200)
      .json({ message: "Subscription deleted", subscription: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
