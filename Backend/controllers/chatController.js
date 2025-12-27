import pool from "../db/index.js";

/**
 * GET /api/chat/history/:otherUserId?limit=50&beforeId=12345
 * تاریخچه چت بین کاربر لاگین‌شده و یک نفر دیگر
 */
export async function getChatHistory(req, res) {
  const me = req.user?.id;
  const otherUserId = Number(req.params.otherUserId);
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const beforeId = req.query.beforeId ? Number(req.query.beforeId) : null;

  if (!me) return res.status(401).json({ message: "Unauthorized" });
  if (!otherUserId) return res.status(400).json({ message: "otherUserId required" });

  try {
    const params = [me, otherUserId];
    let whereBefore = "";
    if (beforeId) {
      params.push(beforeId);
      whereBefore = `AND id < $3`;
    }
    params.push(limit);

    const q = `
      SELECT id, sender_id, receiver_id, content, audio_url, sent_at
      FROM "gym-project".chatmessage
      WHERE (
        (sender_id = $1 AND receiver_id = $2) OR
        (sender_id = $2 AND receiver_id = $1)
      )
      ${whereBefore}
      ORDER BY id DESC
      LIMIT $${params.length};
    `;

    const { rows } = await pool.query(q, params);

    // به فرانت معمولاً پیام‌ها رو ASC می‌دیم تا راحت رندر کنه
    res.json(rows.reverse());
  } catch (e) {
    console.error("getChatHistory error:", e);
    res.status(500).json({ message: "Server error" });
  }
}


// Add to Backend/controllers/chatController.js
export async function sendMessage(req, res) {
  const senderId = req.user?.id;
  const { receiverId, content, audioUrl } = req.body;

  if (!senderId) return res.status(401).json({ message: "Unauthorized" });
  if (!receiverId) return res.status(400).json({ message: "receiverId required" });
  if (!content && !audioUrl) return res.status(400).json({ message: "content or audioUrl required" });

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO "gym-project".chatmessage(sender_id, receiver_id, content, audio_url)
      VALUES ($1, $2, $3, $4)
      RETURNING id, sender_id, receiver_id, content, audio_url, sent_at;
      `,
      [senderId, receiverId, content || null, audioUrl || null]
    );

    const message = rows[0];

    // Emit via socket if available
    // This requires access to io instance

    res.status(201).json(message);
  } catch (e) {
    console.error("sendMessage error:", e);
    res.status(500).json({ message: "Server error" });
  }
}
