const http = require("http");
const path = require("path");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

// Load env vars
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = require("./config/db");
const initializeSocket = require("./sockets/socket");
const errorMiddleware = require("./middleware/error");

// Routes
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const campusRoutes = require("./routes/campusRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Express app setup
const app = express();

// Disable ETags to prevent 304 responses and ensure fresh data for API calls
app.set("etag", false);

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Helmet with production-friendly CSP (Allows Razorpay & Maps)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https://*.openstreetmap.org", "https://*.tile.openstreetmap.org", "https://*.cartocdn.com"],
      connectSrc: ["'self'", "ws:", "wss:", "https://api.razorpay.com", "https://lumberjack.razorpay.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

const logFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(morgan(logFormat));

// Explicitly prevent caching for all API routes
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/api/", limiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/campuses", campusRoutes);
app.use("/api/admin", adminRoutes);

// Root routes
app.get("/", (req, res) => {
  res.status(200).json({ 
    message: "CampusBridge API is running", 
    docs: "https://github.com/nomaantalib/CampusBridge",
    status: "operational"
  });
});

app.get("/api", (req, res) => {
  res.status(200).json({ 
    message: "Welcome to the CampusBridge API", 
    version: "1.2.0",
    endpoints: ["/auth", "/tasks", "/payments", "/campuses", "/admin"]
  });
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error Handling Middleware
app.use(errorMiddleware);

// Connect to database
connectDB();

const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

// Make io accessible to routes
app.set("io", io);

const BASE_PORT = parseInt(process.env.PORT) || 5000;

const port = BASE_PORT;

server.listen(port, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
    console.log(`API: http://127.0.0.1:${port}/api`);
    console.log(`WebSocket: ws://127.0.0.1:${port}`);
}).on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`Error: Port ${port} is already in use.`);
        console.error(`Please close the process using port ${port} and try again.`);
    } else {
        console.error(` Server error:`, err);
    }
    process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});
