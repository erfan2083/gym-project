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
