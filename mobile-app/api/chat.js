// mobile-app/api/chat.js
import api from "./client";

/**
 * Get chat history with another user
 * @param {number|string} otherUserId - The ID of the other user
 * @param {Object} options - Optional parameters
 * @param {number} options.limit - Max messages to fetch (default: 50)
 * @param {number} options.beforeId - Get messages before this ID (for pagination)
 */
export async function getChatHistory(otherUserId, options = {}) {
  const { limit = 50, beforeId } = options;
  
  let url = `/api/chat/history/${otherUserId}?limit=${limit}`;
  if (beforeId) {
    url += `&beforeId=${beforeId}`;
  }
  
  const res = await api.get(url);
  return res.data;
}

/**
 * Send a message (fallback if socket fails)
 * Note: Primary method should be via socket
 */
export async function sendMessage({ receiverId, content, audioUrl }) {
  const res = await api.post("/api/chat/send", {
    receiverId,
    content,
    audioUrl,
  });
  return res.data;
}