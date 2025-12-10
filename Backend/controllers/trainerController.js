// Backend/controllers/trainerController.js
import pool from "../db/index.js";
import multer from "multer";
import cloudinary from "../services/cloudinary.js";


/**
 * GET /api/trainer/specialties
 * برگردوندن لیست تخصص‌ها
 */
export const listSpecialties = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name FROM "gym-project".specialty'
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

    let certUrl = null;

    if (req.file) {
      // اگر فایل اومده
      const isPdf = req.file.mimetype === "application/pdf";

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "trainer-certificates",
              resource_type: isPdf ? "raw" : "image",
              format: isPdf ? "pdf" : undefined,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          )
          .end(req.file.buffer);
      });

      certUrl = uploadResult.secure_url;
    } else if (certificateImageUrl && certificateImageUrl !== "") {
      // بکاپ: اگر خواستی URL آماده بفرستی
      certUrl = certificateImageUrl;
    }

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

    return res
      .status(500)
      .json({ message: "خطای سرور در ساخت پروفایل مربی" });
  }
};


// ─── Upload middleware for certificate (memory + Cloudinary) ────────────
const certificateUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // حداکثر ۵ مگابایت
  },
  fileFilter(req, file, cb) {
    // فقط عکس یا PDF
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("فقط فایل تصویری یا PDF مجاز است"));
    }
  },
});

// اینو در روتر استفاده می‌کنیم
export const uploadCertificate = certificateUpload.single("certificate");


export const handleCertificateUpload = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const isPdf = req.file.mimetype === "application/pdf";
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "trainer-certificates", resource_type: isPdf ? "raw" : "image", format: isPdf ? "pdf" : undefined },
      (err, data) => (err ? reject(err) : resolve(data))
    ).end(req.file.buffer);
  });
  res.status(201).json({ url: result.secure_url });
};


// گرفتن پروفایل پابلیک مربی با user_id
export const getMyTrainerProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "احراز هویت انجام نشده است" });
    }

    const result = await pool.query(
      'SELECT * FROM "gym-project".get_trainer_public_profile($1)',
      [userId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "پروفایل مربی برای این کاربر یافت نشد" });
    }

    const row = result.rows[0];

    return res.json({
      userId: userId,
      fullName: row.full_name,
      avatarUrl: row.avatar_url,
      username: row.username,
      gender: row.gender,
      birthDate: row.date_of_birth,
      province: row.province,
      city: row.city,
      bio: row.bio,
      certificateImageUrl: row.certificate_image_url,
      contactPhone: row.contact_phone,
      telegramUrl: row.telegram_url,
      instagramUrl: row.instagram_url,
      specialties: row.specialties || [],
    });
  } catch (err) {
    console.error("getMyTrainerProfile error:", err);
    return res
      .status(500)
      .json({ message: "خطای سرور در گرفتن پروفایل مربی" });
  }
};



export const updateTrainerProfile = async (req, res) => {
  try {
    const userId = req.user?.id; // از JWT
    if (!userId) {
      return res.status(401).json({ message: "احراز هویت انجام نشده است" });
    }

    const {
      name,                // 👈 اسم کامل برای جدول User.full_name
      username,
      gender,
      birthDate,
      province,
      city,
      bio,
      contactPhone,
      telegramUrl,
      instagramUrl,
      specialtyIds = [],
      certificateImageUrl,
    } = req.body;

    await pool.query("BEGIN");

    // 1) آپدیت نام در جدول User اگر پاس شده بود
    if (name && name.trim()) {
      await pool.query(
        `UPDATE "gym-project"."User"
         SET full_name = $2
         WHERE id = $1`,
        [userId, name.trim()]
      );
    }

    // 2) آپدیت trainerprofile
    const profileResult = await pool.query(
      `
      UPDATE "gym-project".trainerprofile
      SET
        username             = COALESCE($2, username),
        bio                  = $3,
        gender               = $4,
        date_of_birth        = $5,
        province             = $6,
        city                 = $7,
        certificate_image_url = COALESCE($8, certificate_image_url),
        contact_phone        = $9,
        telegram_url         = $10,
        instagram_url        = $11
      WHERE user_id = $1
      RETURNING id, user_id, username, bio, gender, date_of_birth,
                province, city, certificate_image_url,
                contact_phone, telegram_url, instagram_url;
      `,
      [
        userId,
        username?.trim() || null,
        bio || null,
        gender || null,
        birthDate || null,
        province || null,
        city || null,
        certificateImageUrl || null,
        contactPhone || null,
        telegramUrl || null,
        instagramUrl || null,
      ]
    );

    if (profileResult.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ message: "پروفایل مربی پیدا نشد" });
    }

    const profile = profileResult.rows[0];

    // 3) مدیریت تخصص‌ها (trainer_specialty)
    if (Array.isArray(specialtyIds)) {
      // اول پاک کن
      await pool.query(
        `DELETE FROM "gym-project".trainer_specialty
         WHERE trainer_profile_id = $1`,
        [profile.id]
      );

      // دوباره ثبت کن
      for (const specId of specialtyIds) {
        await pool.query(
          `
          INSERT INTO "gym-project".trainer_specialty(trainer_profile_id, specialty_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING;
          `,
          [profile.id, specId]
        );
      }
    }

    await pool.query("COMMIT");

    return res.json({
      message: "پروفایل با موفقیت به‌روزرسانی شد",
      profile,
    });
  } catch (err) {
    console.error("updateTrainerProfile error:", err);
    await pool.query("ROLLBACK");
    return res
      .status(500)
      .json({ message: "خطا در به‌روزرسانی پروفایل", error: err.message });
  }
};


// GET /trainers/:trainerId/rating
export const getTrainerRating = async (req, res) => {
  const { trainerId } = req.params;

  try {
    const result  = await pool.query(
      'SELECT * FROM "gym-project".get_trainer_rating_summary($1)',
      [trainerId]
    );

    const summary = result.rows[0] || { avg_rating: 3.5, review_count: 3.5 };

    res.json({
      avgRating: Number(summary.avg_rating),
      reviewCount: summary.review_count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /trainers/:trainerId/reviews
export const getTrainerReviews = async (req, res) => {
  const { trainerId } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT * FROM "gym-project".get_trainer_reviews($1)',
      [trainerId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};