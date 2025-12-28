// Frontend/api/user.js
import api from "./client";

// file: همون res.assets[0] از ImagePicker
export const uploadAvatar = (file) => {
  const formData = new FormData();

  formData.append("avatar", {
    uri: file.uri,
    name: file.fileName || "avatar.jpg",
    type: file.type || "image/jpeg",
  });

  return api.post("/api/user/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};


export const createTrainerReview = (trainerId, { rating, comment }) => {
  return api.post(`/api/user/trainers/${trainerId}/reviews`, {
    rating,
    comment: comment || null,
  });
};


export async function purchasePlan(planId) {
  const res = await api.post("/api/user/subscriptions/purchase", { planId });
  return res.data;
}



export async function getMyWeekSchedule(weekStart) {
  const res = await api.get("/api/user/schedule/week", {
    params: { weekStart },
  });
  return res.data;
}


// ✅ NEW: Get client's primary trainer (from active subscription)
export async function getMyTrainer() {
  const res = await api.get("/api/user/my-trainer");
  return res.data;
}


// ✅ NEW: Get all trainers the client has active subscriptions with
export async function getMyTrainers() {
  const res = await api.get("/api/user/my-trainers");
  return res.data;
}