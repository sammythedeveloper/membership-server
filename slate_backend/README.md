# ⚙️ HorizonHub Backend API

The core engine of the HorizonHub membership platform. This is a production-grade Node.js API built with **Express** and **PostgreSQL**, designed to handle secure authentication, subscription logic, and real-time payment processing.

---

## 🛠 Tech Stack

* **Runtime:** Node.js (v18+)
* **Framework:** Express.js
* **Database:** PostgreSQL (with `pg` pool management)
* **Security:** JSON Web Tokens (JWT), Bcrypt.js, CORS
* **Payments:** Stripe SDK
* **Hosting:** Railway

---

## 🚀 Key Backend Features

### 1. Robust Payment Lifecycle
Integrated **Stripe Webhooks** to create a "source of truth" for user subscriptions. The server listens for `checkout.session.completed` and `customer.subscription.deleted` events to automatically sync database permissions.

### 2. Custom Middleware Architecture
* **`verifyToken`**: Validates JWTs to protect sensitive membership routes.
* **`requireAdmin`**: Role-based access control (RBAC) to restrict administrative actions.
* **Raw Body Parsing**: Specialized middleware for Stripe signature verification to prevent replay attacks.

### 3. Scalable Database Design
Uses a relational PostgreSQL schema to manage:
* **Users**: Securely hashed credentials and role management.
* **Subscriptions**: Tracking Stripe Customer IDs, Plan IDs, and status (active/canceled).

---

## 📂 API Structure

### Auth Routes (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/signup` | Register new user & hash password |
| POST | `/login` | Authenticate & return JWT |

### Subscription Routes (`/api/subscription`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/checkout` | Create Stripe Checkout Session (Protected) |
| POST | `/webhook` | Stripe signature verification & DB sync |

---

## 🛠 Local Setup

### 1. Clone & Install
```bash
git clone [https://github.com/your-username/horizon-hub-backend.git](https://github.com/your-username/horizon-hub-backend.git)
cd horizon-hub-backend
npm install
