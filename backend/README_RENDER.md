# Deploying CampusBridge Backend to Render

Follow these steps to deploy your backend to [Render.com](https://render.com).

## 1. Prerequisites
- Create a [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) account and create a cluster.
- Get your **Connection String** (e.g., `mongodb+srv://<user>:<password>@cluster0.mongodb.net/campusbridge`).
- Create a [Render](https://render.com) account.

## 2. Prepare the Code
- Push this `backend` folder to a **GitHub** repository.
- Ensure `package.json` has `"start": "node src/server.js"`.

## 3. Create a Web Service on Render
1. Go to your Render Dashboard -> **New** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the following:
   - **Name**: `campusbridge-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render will handle this)
   - `MONGODB_URI`: `<Your Atlas Connection String>`
   - `JWT_SECRET`: `<A random secure string>`

## 4. Update Frontend
Once deployed, Render will give you a URL like `https://campusbridge-api.onrender.com`.
- Copy this URL.
- Update `frontend/src/services/api.js` or set it in your `.env` file for the APK build.

## 5. WebSocket Support
Render Web Services support WebSockets automatically. No additional config is needed!
