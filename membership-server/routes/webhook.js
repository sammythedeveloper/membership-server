// // routes/webhook.js
// import express from "express";
// import Stripe from "stripe";
// import pool from "../db.js";

// const router = express.Router();
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // from Stripe dashboard

// router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
//   const sig = req.headers["stripe-signature"];
//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//   } catch (err) {
//     console.error("Webhook verification failed:", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   if (event.type === "checkout.session.completed") {
//     const session = event.data.object;

//     const activity = session.metadata.activity;
//     const duration = session.metadata.duration;
//     const userEmail = session.customer_email;

//     try {
//       const userRes = await pool.query("SELECT id FROM users WHERE email = $1", [userEmail]);
//       if (!userRes.rows[0]) throw new Error("User not found");

//       const userId = userRes.rows[0].id;
//       const start_date = new Date();
//       const end_date = new Date();
//       end_date.setMonth(end_date.getMonth() + parseInt(duration));

//       await pool.query(
//         `INSERT INTO subscriptions (user_id, activity, duration, start_date, end_date, status)
//          VALUES ($1, $2, $3, $4, $5, 'active')`,
//         [userId, activity, duration, start_date, end_date]
//       );

//       console.log(`Subscription added for ${userEmail}: ${activity}`);
//     } catch (err) {
//       console.error("Failed to insert subscription:", err);
//     }
//   }

//   res.status(200).json({ received: true });
// });

// export default router;
