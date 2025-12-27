import pool from "../db/index.js";
import { io } from "../server.js";

export function setupChatSocket() {
  io.on("connection", (socket) => {
    const userId = socket.user.id;

    socket.join(`user:${userId}`);

    socket.on("chat:send", async (payload, ack) => {
      try {
        const receiverId = Number(payload.receiverId);
        const content = payload.content ?? null;
        const audioUrl = payload.audioUrl ?? null;

        if (!receiverId) throw new Error("receiverId required");
        if (!content && !audioUrl) throw new Error("content or audioUrl required");

        const { rows } = await pool.query(
          `
          INSERT INTO "gym-project".chatmessage(sender_id, receiver_id, content, audio_url)
          VALUES ($1, $2, $3, $4)
          RETURNING id, sender_id, receiver_id, content, audio_url, sent_at;
          `,
          [userId, receiverId, content, audioUrl]
        );

        const message = rows[0];

        // ارسال به گیرنده
        io.to(`user:${receiverId}`).emit("chat:new", message);
        // ارسال به خود فرستنده (اگر چند دستگاه وصل باشد)
        io.to(`user:${userId}`).emit("chat:new", message);

        ack?.({ ok: true, message });
      } catch (e) {
        console.error("chat:send error:", e);
        ack?.({ ok: false, error: e.message });
      }
    });

    socket.on("disconnect", () => {
      // optional logging
    });
  });
}
