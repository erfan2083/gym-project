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


export const uploadCertificate = async (file) => {
  const form = new FormData();

  form.append("certificate", {
  uri: file.uri,
  type: file.mimeType || "image/jpeg",
  name: file.name || "certificate.jpg"
});

  return api.post("/api/trainer/upload-certificate", form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};


export const getMyTrainerProfile = async () => {
  const res = await api.get("/api/trainer/getTrainerPublicProfile");
  return res.data; // { userId, fullName, avatarUrl, ... }
};



export const updateTrainerProfile = (payload) =>
  api.put("/api/trainer/updateTrainerProfile", payload);



export const getTrainerRatingSummary = async (trainerId) => {
  const res = await api.get(`/api/trainer/${trainerId}/rating`);
  return res.data;
};


export const getTrainerReviews = async (trainerId) => {
  const res = await api.get(`/api/trainer/${trainerId}/reviews`);
  return res.data;
};


/* ------------------------------------------------------------------
 * پلن‌های مربی (Plan APIs)
 * -----------------------------------------------------------------*/

/**
 * ساخت پلن جدید توسط مربی لاگین‌شده
 * POST /api/trainer/creatPlan
 *
 * payload:
 * {
 *   title: string,
 *   description?: string,
 *   price?: number | string,
 *   durationInDays: number | string
 * }
 */
export const createTrainerPlan = async (payload) => {
  const { title, description, price, durationInDays } = payload;

  const body = {
    title,
    description: description || null,
    price: price ?? 0,
    durationInDays,
  };

  const res = await api.post("/api/trainer/creatPlan", body);
  return res.data;
};



/**
 * ویرایش پلن مربی
 * PUT /api/trainer/:planId/update
 *
 * payload:
 * {
 *   title: string,
 *   description?: string,
 *   price?: number | string,
 *   durationInDays: number | string
 * }
 */
export const updateTrainerPlan = async (planId, payload) => {
  const { title, description, price, durationInDays } = payload;

  const body = {
    title,
    description: description || null,
    price: price ?? 0,
    durationInDays,
  };

  const res = await api.put(`/api/trainer/${planId}/update`, body);
  return res.data;
};

/**
 * حذف پلن مربی
 * DELETE /api/trainer/:planId/delete
 */
export const deleteTrainerPlan = async (planId) => {
  const res = await api.delete(`/api/trainer/${planId}/delete`);
  return res.data;
};

/**
 * لیست پلن‌های مربی لاگین‌شده
 * GET /api/trainer/plansList
 *
 * خروجی نمونه:
 * [
 *   {
 *     id,
 *     title,
 *     description,
 *     price,
 *     duration_in_days,
 *     created_at
 *   },
 *   ...
 * ]
 */
export const getMyTrainerPlans = async () => {
  const res = await api.get("/api/trainer/plansList");
  return res.data;
};

/**
 * لیست پلن‌های یک مربی (پابلیک برای نمایش به شاگردها)
 * GET /api/trainer/:trainerId/plan
 */
export const getTrainerPlans = async (trainerId) => {
  const res = await api.get(`/api/trainer/${trainerId}/plan`);
  return res.data;
};