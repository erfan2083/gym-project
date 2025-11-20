// Backend/controllers/trainerController.js
import pool from "../db/index.js";

/**
 * GET /api/trainer/specialties
 * برگردوندن لیست تخصص‌ها
 */
export const listSpecialties = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name FROM "gym-project".specialty ORDER BY name'
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("listSpecialties error:", err);
    return res.status(500).json({ message: "خطای سرور در دریافت تخصص‌ها" });
  }
};

/**
 * POST /api/trainer/profile
 * ساخت پروفایل مربی بعد از ساین‌آپ
 * نیاز به JWT دارد (req.user.id)
 */
export const createTrainerProfile = async (req, res) => {
  try {
    // باید قبلاً authMiddleware اجرا شده باشه
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "احراز هویت انجام نشده است" });
    }

    const {
      username,
      gender,              // "male" | "female"
      birthDate,           // "YYYY-MM-DD" (میلادی) — تبدیل از شمسی در فرانت/بک
      province,
      city,
      bio,
      certificateImageUrl,
      contactPhone,
      telegramUrl,
      instagramUrl,
      specialtyIds,        // آرایه‌ای از id تخصص‌ها [1,2,5,...]
    } = req.body;

    // اعتبارسنجی ساده
    if (!username || String(username).trim().length === 0) {
      return res.status(400).json({ message: "نام کاربری (ID) الزامی است" });
    }

    // نرمال‌سازی مقادیر خالی → null
    const g = gender ? String(gender).toLowerCase() : null;
    const dob = birthDate && birthDate !== "" ? birthDate : null;
    const prov = province && province !== "" ? province : null;
    const c = city && city !== "" ? city : null;
    const b = bio && bio !== "" ? bio : null;
    const certUrl =
      certificateImageUrl && certificateImageUrl !== ""
        ? certificateImageUrl
        : null;
    const phone =
      contactPhone && contactPhone !== "" ? contactPhone : null;
    const telegram =
      telegramUrl && telegramUrl !== "" ? telegramUrl : null;
    const insta =
      instagramUrl && instagramUrl !== "" ? instagramUrl : null;

    // specialtyIds باید یا null باشد یا آرایه int
    const specArray =
      Array.isArray(specialtyIds) && specialtyIds.length > 0
        ? specialtyIds
        : null;

    // صدا زدن پروسیجر PostgreSQL
    // امضای پروسیجر:
    // create_trainer_profile(
    //   p_user_id, p_username, p_gender, p_date_of_birth,
    //   p_province, p_city, p_bio,
    //   p_certificate_image_url, p_contact_phone,
    //   p_telegram_url, p_instagram_url, p_specialty_ids int[]
    // )
    await pool.query(
      'CALL "gym-project".create_trainer_profile($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
      [
        userId,
        username,
        g,
        dob,
        prov,
        c,
        b,
        certUrl,
        phone,
        telegram,
        insta,
        specArray,
      ]
    );

    return res.status(201).json({ message: "پروفایل مربی با موفقیت ساخته شد" });
  } catch (err) {
    console.error("createTrainerProfile error:", err);

    // یوزرنیم تکراری (ایندکس یونیک روی trainerprofile.username)
    if (err.code === "23505") {
      return res.status(409).json({
        message: "این نام کاربری قبلاً استفاده شده است",
      });
    }

    const msg = err.message || "";

    if (msg.includes("Only coaches can create trainer profiles")) {
      return res.status(403).json({
        message: "فقط کاربرانی با نقش مربی می‌توانند پروفایل مربی بسازند",
      });
    }

    if (msg.includes("Invalid gender")) {
      return res.status(400).json({ message: "مقدار جنسیت نامعتبر است" });
    }

    return res.status(500).json({ message: "خطای سرور در ساخت پروفایل مربی" });
  }
};
