import pool from "../db/index.js";


export async function updateUserAvatar(req, res) {
  try {
    const userId = req.user.id;            // از توکن
    const { avatarUrl } = req.body;        // URL فایل آپلود شده

    if (!avatarUrl) {
      return res.status(400).json({ message: "avatarUrl is required" });
    }

    await pool.none(
      `CALL "gym-project".update_user_avatar($1, $2)`,
      [userId, avatarUrl]
    );

    res.json({ message: "Avatar updated successfully", avatarUrl });
  } catch (err) {
    console.error("Avatar update error:", err);
    res.status(500).json({ message: "Server error updating avatar" });
  }
}