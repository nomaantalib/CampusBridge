# 🚀 Deploying CampusBridge Backend to Render

This guide provides the exact steps to deploy your backend to the Render platform for production.

---

## 1. Environment Variables
You MUST set the following environment variables in the Render "Environment" tab:

| Variable | Recommended Value / Description |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render will override this, but good to have) |
| `MONGODB_URI` | Your **MongoDB Atlas** cluster connection string |
| `JWT_SECRET` | A long, random string for token security |
| `RAZORPAY_KEY_ID` | Your Razorpay API Key |
| `RAZORPAY_KEY_SECRET` | Your Razorpay API Secret |
| `PLATFORM_COMMISSION` | `0.20` (optional, defaults to 20%) |
| `ALLOWED_ORIGINS` | `https://your-frontend-domain.onrender.com` |

---

## 2. Render Service Settings

### Build Command
```bash
npm install
```

### Start Command
```bash
npm start
```

---

## 3. Production Hardening
The application is already prepopulated with production-grade middleware:
- **Helmet**: Configured with a custom **Content Security Policy** to allow Razorpay and OpenStreetMap.
- **CORS**: Restricted to your `ALLOWED_ORIGINS`.
- **Rate Limiting**: Limits API abuse in production.
- **Atomic Operations**: All financial transactions use Mongoose sessions for 100% data integrity.

---

## 4. Connectivity Check
After deployment, verify the health of your service by visiting:
`https://your-backend-domain.onrender.com/health`

Expected response:
```json
{ "status": "ok", "timestamp": "..." }
```
