import api from "./client";

export const uploadAvatar = (avatarUrl) =>
  api.post("/user/avatar", { avatarUrl });
