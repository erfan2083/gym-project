import express from "express";
import {
  updateUserAvatar,
  uploadAvatarMiddleware,
  addReview,
  purchasePlan
} from "../controllers/userController.js";
import {
  getMyWeekSchedule,
  getMyTrainer,
  getMyTrainers,
} from "../controllers/clientController.js";
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

userRouter.get("/schedule/week", authMiddleware, getMyWeekSchedule);
userRouter.get("/my-trainer", authMiddleware, getMyTrainer);
userRouter.get("/my-trainers", authMiddleware, getMyTrainers);

export default userRouter;