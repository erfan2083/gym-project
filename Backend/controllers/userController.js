// Backend/controllers/userController.js
import multer from "multer";
import cloudinary from "../services/cloudinary.js";
import pool from "../db/index.js";   // همونی که برای pool استفاده می‌کنی

// حافظه‌ی موقت برای فایل (روی دیسک ننویسه)
const upload = multer({ storage: multer.memoryStorage() });

// ⚠️ این میدل‌ور رو در route استفاده می‌کنیم:
export const uploadAvatarMiddleware = upload.single("avatar");

// کنترلر اصلی
export async function updateUserAvatar(req, res) {
  try {
    const userId = req.user?.id; // از authMiddleware و JWT
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "فایل آواتار ارسال نشده است" });
    }

    // buffer فایل از multer
    const fileBuffer = req.file.buffer;

    // آپلود به Cloudinary با stream
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "gym-project/avatars",
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(fileBuffer);
    });

    const avatarUrl = uploadResult.secure_url;

    // آپدیت در دیتابیس با پروسیجر
    await pool.query(
      `CALL "gym-project".update_user_avatar($1, $2)`,
      [userId, avatarUrl]
    );

    return res.json({
      message: "آواتار با موفقیت بروزرسانی شد",
      avatarUrl,
    });
  } catch (err) {
    console.error("Avatar update error:", err);
    return res.status(500).json({
      message: "خطا در بروزرسانی آواتار",
    });
  }
}
