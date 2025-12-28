import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getChatHistory, sendMessage } from "../controllers/chatController.js";

const chatRouter = express.Router();

chatRouter.get("/history/:otherUserId", authMiddleware, getChatHistory);
chatRouter.post("/send", authMiddleware, sendMessage);

export default chatRouter;
