import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  startAIChat,
  sendAIMessage,
} from "../controllers/aiChatController.js";

const aiChatRouter = express.Router();

// شروع چت با AI و دریافت برنامه تمرینی
aiChatRouter.post("/start", authMiddleware, startAIChat);

// ارسال پیام به AI
aiChatRouter.post("/message", authMiddleware, sendAIMessage);

export default aiChatRouter;