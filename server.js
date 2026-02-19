require("dotenv").config();

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const agoraRoutes = require("./routes/agora");

const app = express();

/* ===============================
   ALLOWED ORIGINS  (IMPORTANT)
=================================*/
const allowedOrigins = [
  "http://localhost:3000",
  "https://live-chat-app-frontend-t8o6.vercel.app", // ← CHANGE THIS
];

/* ===============================
   MIDDLEWARE
=================================*/
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

/* ===============================
   MONGO CONNECTION
=================================*/
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err.message));

/* ===============================
   ROUTES
=================================*/
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/agora", agoraRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Backend Running Successfully");
});

/* ===============================
   SOCKET.IO SERVER
=================================*/
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
});

/* ===============================
   ONLINE USERS STORAGE
=================================*/
const onlineUsers = {}; // { userId: socketId }

/* ===============================
   SOCKET EVENTS
=================================*/
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("register-user", (userId) => {
    if (!userId) return;
    onlineUsers[userId] = socket.id;
    console.log("✅ User registered:", userId);
  });

  socket.on("call-user", (data) => {
    const targetSocket = onlineUsers[data.to];

    if (targetSocket) {
      io.to(targetSocket).emit("incoming-call", data);
      console.log("📞 Calling:", data.to);
    } else {
      socket.emit("user-offline", { message: "User is offline" });
    }
  });

  socket.on("accept-call", (data) => {
    const targetSocket = onlineUsers[data.to];
    if (targetSocket) io.to(targetSocket).emit("call-accepted", data);
  });

  socket.on("reject-call", (data) => {
    const targetSocket = onlineUsers[data.to];
    if (targetSocket) io.to(targetSocket).emit("call-rejected", data);
  });

  socket.on("missed-call", (data) => {
    const targetSocket = onlineUsers[data.to];
    if (targetSocket) io.to(targetSocket).emit("missed-call", data);
  });

  socket.on("end-call", (data) => {
    const targetSocket = onlineUsers[data.to];
    if (targetSocket) io.to(targetSocket).emit("call-ended", data);
  });

  socket.on("disconnect", () => {
    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        console.log("❌ User disconnected:", userId);
        break;
      }
    }
  });
});

/* ===============================
   START SERVER
=================================*/
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
