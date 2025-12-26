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



export const addReview = async (req, res) => {
  const traineeId = req.user.id;             // از JWT
  const { trainerId } = req.params;
  const { rating, comment } = req.body;

  if (!rating) {
    return res.status(400).json({ message: "rating is required" });
  }

  try {
    await pool.query(
      'CALL "gym-project".add_review($1, $2, $3, $4)',
      [traineeId, trainerId, rating, comment || null]
    );

    res.status(201).json({ message: "Review submitted successfully" });
  } catch (err) {
    console.error(err);

    if (err.constraint === "review_trainee_trainer_unique") {
      return res.status(400).json({
        message: "You have already submitted a review for this trainer",
      });
    }

    if (err.message.includes("Rating must be between")) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    res.status(500).json({ message: "Server error" });
  }
};


export const purchasePlan = async (req, res) => {
  const traineeId = req.user?.id; // از auth middleware
  const { planId } = req.body;

  if (!traineeId) return res.status(401).json({ message: "Unauthorized" });
  if (!planId) return res.status(400).json({ message: "planId is required" });

  try {
    // OUT params در CALL معمولاً به صورت یک row برمی‌گرده (با pg)
    const { rows } = await pool.query(
      'CALL "gym-project".purchase_plan($1, $2, NULL, NULL)',
      [traineeId, Number(planId)]
    );

    // بعضی setups rows[0] می‌ده، بعضی نه. پس بهتره بلافاصله SELECT هم بزنیم
    // (اگر خواستی، دقیقاً مطابق db helper خودت تنظیم می‌کنم)

    return res.json({ ok: true });
  } catch (e) {
    console.error("purchasePlan error:", e);
    return res.status(400).json({ message: e.message || "Purchase failed" });
  }
};