import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getChatHistory } from "../controllers/chatController.js";

const chatRouter = express.Router();

chatRouter.get("/history/:otherUserId", authMiddleware, getChatHistory);

export default chatRouter;
