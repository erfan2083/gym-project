// api/trainer.js
import api from "./client";

/**
 * گرفتن لیست تخصص‌ها
 * GET /trainer/specialties
 * خروجی: آرایه‌ای از { id, name }
 */
export async function getSpecialties() {
  const res = await api.get("/api/trainer/specialties");
  return res.data;
}

/**
 * ساخت پروفایل مربی
 * POST /trainer/profile
 *
 * ورودی:
 * {
 *   username: string,
 *   gender: "male" | "female",
 *   birthDate?: "YYYY-MM-DD",        // میلادی - از شمسی تبدیل شده
 *   province: string,
 *   city: string,
 *   bio?: string,
 *   certificateImageUrl?: string,
 *   contactPhone?: string,
 *   telegramUrl?: string,
 *   instagramUrl?: string,
 *   specialtyIds?: number[]          // آرایه id تخصص‌ها
 * }
 *
 * در صورت موفقیت:
 *   { message: "پروفایل مربی با موفقیت ساخته شد" }
 */
export async function createTrainerProfile(payload) {
  const {
    username,
    gender,
    birthDate,
    province,
    city,
    bio,
    certificateImageUrl,
    contactPhone,
    telegramUrl,
    instagramUrl,
    specialtyIds,
  } = payload;

  const body = {
    username,
    gender,
    birthDate: birthDate || null,
    province,
    city,
    bio: bio || null,
    certificateImageUrl: certificateImageUrl || null,
    contactPhone: contactPhone || null,
    telegramUrl: telegramUrl || null,
    instagramUrl: instagramUrl || null,
    // اگر specialtyIds آرایه نبود، یه آرایه خالی می‌فرستیم
    specialtyIds: Array.isArray(specialtyIds) ? specialtyIds : [],
  };

  const res = await api.post("/api/trainer/profile", body);
  return res.data;
}
