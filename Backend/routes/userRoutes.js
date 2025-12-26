import express from "express";
import {
  updateUserAvatar,
  uploadAvatarMiddleware,
  addReview,
  purchasePlan
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";


const userRouter = express.Router();

userRouter.post("/avatar",
    authMiddleware,          // باید توکن ارسال بشه
  uploadAvatarMiddleware,  // multer برای خواندن فایل
  updateUserAvatar);


userRouter.post(
  "/:trainerID/reviews",
  authMiddleware,          // باید لاگین باشه
  addReview
);


userRouter.post("/subscriptions/purchase", authMiddleware, purchasePlan);


export default userRouter;