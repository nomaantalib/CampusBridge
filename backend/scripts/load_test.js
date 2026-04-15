const { io } = require("socket.io-client");
const { v4: uuidv4 } = require("uuid");

const SOCKET_URL = "http://localhost:5000";
const NUM_USERS = 15;
const CAMPUS_ID = "main-campus";

console.log(`🚀 Starting load test with ${NUM_USERS} users...`);

const users = [];

function createSimulatedUser(index) {
  const userId = `user-${index}-${uuidv4().substring(0, 8)}`;
  const userData = {
    id: userId,
    name: `Simulated User ${index}`,
    role: index % 2 === 0 ? "student" : "helper",
  };

  const socket = io(SOCKET_URL, {
    transports: ["websocket"],
    reconnection: true,
  });

  socket.on("connect", () => {
    console.log(`[${userId}] ✅ Connected`);
    socket.emit("joinCampus", CAMPUS_ID, userData);

    // Simulate location updates
    const interval = setInterval(() => {
      const lat = 12.9716 + (Math.random() - 0.5) * 0.01;
      const lng = 77.5946 + (Math.random() - 0.5) * 0.01;

      socket.emit("location-update", {
        userId: userId,
        latitude: lat,
        longitude: lng,
        role: userData.role,
        name: userData.name,
      });
    }, 3000);

    users.push({ socket, interval, userId });
  });

  socket.on("connect_error", (err) => {
    console.error(`[${userId}] ❌ Connection Error:`, err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[${userId}] 🔌 Disconnected: ${reason}`);
  });

  socket.on("user-online", (data) => {
    if (data.userId !== userId) {
      // console.log(`[${userId}] 👤 New user online: ${data.name}`);
    }
  });

  socket.on("users-location-update", (locations) => {
    // console.log(`[${userId}] 📍 Received location updates for ${locations.length} users`);
  });
}

// Spawn users with a slight delay between them
for (let i = 0; i < NUM_USERS; i++) {
  setTimeout(() => createSimulatedUser(i), i * 200);
}

// Keep the process running for 60 seconds then cleanup
setTimeout(() => {
  console.log("🛑 Load test duration reached. Cleaning up...");
  users.forEach((u) => {
    clearInterval(u.interval);
    u.socket.disconnect();
  });
  console.log("✅ Load test finished.");
  process.exit(0);
}, 60000);
