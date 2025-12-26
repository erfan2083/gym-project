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


export const getTopTrainers = async (limit = 3) => {
  try {
    const res = await api.get(`/api/trainer/top-trainers?limit=${limit}`);
    
    // گرفتن آرایه خام از ریسپانس
    const rawList = Array.isArray(res.data) 
      ? res.data 
      : (res.data?.trainers || []);

    // تبدیل داده‌های دیتابیس (snake_case) به فرمت استاندارد کامپوننت (camelCase)
    return rawList.map(item => ({
      id: item.id,
      // دیتابیس full_name میدهد، ما name میخواهیم
      name: item.full_name || item.username || "مربی",
      // دیتابیس avatar_url میدهد
      avatarUrl: item.avatar_url || null, 
      username: item.username,
      city: item.city || "نامشخص",
      // تبدیل رشته به عدد برای اطمینان
      rating: Number(item.rating) || 0,
      reviewCount: Number(item.review_count) || 0,
    }));

  } catch (error) {
    console.error("Error fetching top trainers:", error);
    return [];
  }
};



// به فایل api/trainer.js اضافه کنید

/**
 * دریافت پروفایل پابلیک یک مربی خاص با ID
 * (شامل بیوگرافی، تخصص‌ها، عکس مدرک و ...)
 */
export const getTrainerProfileById = async (trainerId) => {
  // فرض بر این است که بک‌اند شما روتی شبیه به این دارد:
  // GET /api/trainer/profile/:id
  // که دقیقاً همان خروجی getMyTrainerProfile را برمی‌گرداند
  const res = await api.get(`/api/trainer/profile/${trainerId}`);
  return res.data;
};


/**
 * لیست رشته‌ها + تعداد مربی هر رشته
 * GET /api/trainer/specialties/with-count
 */
export async function getSportsCategories() {
  const res = await api.get("/api/trainer/specialties/with-count");

  // خروجی DB: {id, name, trainer_count}
  return (res.data || []).map((x) => ({
    id: x.id,
    title: x.name,
    count: Number(x.trainer_count || 0),
    iconType: x.id, // فعلاً برای مپ‌کردن آیکن در UI
  }));
}

/**
 * لیست مربی‌های یک رشته
 * GET /api/trainer/specialties/:specialtyId/trainers
 */
export async function getTrainersBySport(specialtyId) {
  const res = await api.get(`/api/trainer/specialties/${specialtyId}/trainers`);

  return (res.data || []).map((t) => ({
    id: t.id,
    name: t.full_name || t.username || "مربی",
    avatarUrl: t.avatar_url || null,
    username: t.username,
    city: t.city || "نامشخص",
    rating: Number(t.rating || 0),
    reviewCount: Number(t.review_count || 0),
  }));
}


export async function getMyAthletes() {
  const res = await api.get("/api/trainer/my-athletes");
  return res.data || [];
}
