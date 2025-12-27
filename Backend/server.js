// Backend/server.js
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import jwt from "jsonwebtoken";
import { setupChatSocket } from "./realtime/chatSocket.js";



const PORT = process.env.PORT || 3000;

app.get("/ping", (req, res) => {
  res.status(200).json({
    message: "✅ Server is reachable!",
    time: new Date().toISOString(),
    ip: req.ip,
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // بعداً محدودش می‌کنیم به دامین/اپ
    methods: ["GET", "POST"],
  },
});

// --- Socket Auth (JWT) ---
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) return next(new Error("Unauthorized"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (e) {
    next(new Error("Unauthorized"));
  }
});

setupChatSocket();

export { io };



server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
