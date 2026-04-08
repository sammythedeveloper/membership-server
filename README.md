# 🚀 HorizonHub | Full-Stack Community Membership Prototype

**HorizonHub** is a modern, full-stack membership management system designed to demonstrate secure payment integration, automated subscription lifecycles, and cloud-native deployment. 

This prototype was built to solve the "last mile" of SaaS development: handling real-time payment events from **Stripe** and synchronizing them with a persistent **PostgreSQL** database in a distributed production environment.

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Tailwind CSS, Axios instance |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL (Railway Managed) |
| **Payments** | Stripe API (Checkout & Webhooks) |
| **Deployment** | Vercel (Frontend), Railway (Backend) , Aiven (Database) |

---

## 💡 Key Engineering Challenges Solved

### 1. Secure Webhook Architecture
Implemented a robust **Stripe Webhook** listener that utilizes **Signature Verification**.
* **The Challenge:** Ensuring that payment data sent to the backend is authentic and hasn't been tampered with.
* **The Solution:** Configured a raw-body parser using `express.raw()` to verify the `stripe-signature` header against the `STRIPE_WEBHOOK_SECRET`.
* **The Result:** Automated database updates (e.g., granting user "Pro" status) the moment a payment is confirmed by Stripe.

### 2. Cross-Origin Resource Sharing (CORS)
Managed security between a Vercel-hosted frontend and a Railway-hosted backend.
* **The Challenge:** Browsers blocking "Preflight" (OPTIONS) requests in a multi-domain cloud environment.
* **The Solution:** Implemented a dynamic CORS allowlist in Express to securely permit requests from the Vercel production origin while blocking unauthorized traffic.

### 3. Production Environment Management
Transitioned the application from `localhost` to a live cloud architecture.
* **The Challenge:** Synchronizing API keys, database connection strings, and dynamic ports across two different cloud providers.
* **The Solution:** Orchestrated environment variables across Vercel and Railway to ensure seamless communication between the client and server.

---

## 📸 Features 

* **UI and Assests:** AI generate HD pictures and modern animation and schematic look.
* **Secure Authentication:** JWT-based login and signup flow.
* **Subscription Tiers:** Multiple pricing plans (Basic, Pro, Premium) integrated with Stripe Prices.
* **Real-time Synchronization:** Database state updates automatically via Stripe Webhooks.
* **Responsive Design:** Fully optimized for mobile and desktop using Tailwind CSS.

---

## 🏃 Getting Started

### 1. Clone & Install
```bash
git clone [https://github.com/sammythedeveloper/horizon-hub.git](https://github.com/sammythedeveloper/horizon-hub.git)
npm install
