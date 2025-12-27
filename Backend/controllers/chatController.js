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
