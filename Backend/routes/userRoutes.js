import express from "express";
import {
  updateUserAvatar
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";


const userRouter = express.Router();

router.post("/user/avatar", authMiddleware, updateUserAvatar);


export default userRouter;