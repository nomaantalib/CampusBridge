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

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(helmet());
app.use(morgan("dev"));

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

// ✅ Dynamic Port Shifting - Find available port (promises-based, prevents recursion)
const findAvailablePort = (startPort) => {
  return new Promise((resolve) => {
    const testServer = http.createServer();
    testServer
      .listen(startPort, () => {
        testServer.close();
        resolve(startPort);
      })
      .on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.log(
            `⚠️  Port ${startPort} in use, trying ${startPort + 1}...`,
          );
          resolve(findAvailablePort(startPort + 1));
        } else {
          throw err;
        }
      });
  });
};

// Start server on available port
findAvailablePort(BASE_PORT).then((port) => {
  server
    .listen(port, () => {
      console.log(
        `✅ Server running in ${process.env.NODE_ENV} mode on port ${port}`,
      );
      console.log(`📡 API: http://127.0.0.1:${port}/api`);
      console.log(`🔌 WebSocket: ws://127.0.0.1:${port}`);
    })
    .on("error", (err) => {
      console.error(`❌ Server error:`, err);
      process.exit(1);
    });
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
