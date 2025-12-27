// Backend/routes/trainerRoutes.js
import express from "express";
import {
  listSpecialties,
  createTrainerProfile,
  uploadCertificate,
  handleCertificateUpload,
  getMyTrainerProfile,
  updateTrainerProfile,
  getTrainerRating,
  getTrainerReviews,
  createPlan,
  updatePlan,
  deletePlan,
  getMyPlans,
  getTrainerPlansPublic,
  getTopTrainers,
  getTrainerProfile,
  listSpecialtiesWithCount,
  getTrainersBySpecialty,
  getMyAthletes,
  getWeekScheduleForCoach,
  addScheduleItem,
  deleteScheduleItem,
  getWorkoutsLibrary,
  createMyWorkout,
  uploadWorkoutVideo,
} from "../controllers/trainerController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const trainerRouter = express.Router();

// لیست تخصص‌ها (نیاز به لاگین ندارد — می‌تونی اگه خواستی محافظت کنی)
trainerRouter.get("/specialties", listSpecialties);

// ساخت پروفایل مربی (فقط کاربر لاگین کرده)
trainerRouter.post("/profile", authMiddleware, createTrainerProfile);

trainerRouter.post("/upload-certificate",
  authMiddleware,
  uploadCertificate,
  handleCertificateUpload
);


trainerRouter.get("/getTrainerPublicProfile", authMiddleware, getMyTrainerProfile);

trainerRouter.put("/updateTrainerProfile", authMiddleware, updateTrainerProfile);


trainerRouter.get(
  "/:trainerId/rating",
  getTrainerRating
);

// گرفتن لیست نظرات مربی
trainerRouter.get(
  "/:trainerId/reviews",
  getTrainerReviews
);


trainerRouter.post("/creatPlan", authMiddleware, createPlan);          // ساخت پلن
trainerRouter.put("/:planId/update", authMiddleware, updatePlan);    // ویرایش پلن
trainerRouter.delete("/:planId/delete", authMiddleware, deletePlan); // حذف پلن
trainerRouter.get("/plansList", authMiddleware, getMyPlans);         // لیست پلن‌های خود مربی

// ✅ برای شاگردها و عموم (نیاز به لاگین هم می‌تونه نداشته باشه، طبق نیازت)
// اینجا لاگین رو اجبار نکردم؛ اگر می‌خوای فقط کاربر لاگین‌شده ببینه، authMiddleware رو اضافه کن
trainerRouter.get("/:trainerId/plan", getTrainerPlansPublic);


trainerRouter.get("/top-trainers", getTopTrainers);

trainerRouter.get("/profile/:trainerId", getTrainerProfile);

trainerRouter.get("/specialties/with-count", listSpecialtiesWithCount);
trainerRouter.get("/specialties/:specialtyId/trainers", getTrainersBySpecialty);


trainerRouter.get("/my-athletes", authMiddleware, getMyAthletes);


trainerRouter.get("/schedule/week", authMiddleware, getWeekScheduleForCoach);
trainerRouter.post("/schedule/item", authMiddleware, addScheduleItem);
trainerRouter.delete("/schedule/item/:id", authMiddleware, deleteScheduleItem);

// ✅ Workouts APIs (coach only)
trainerRouter.get("/workouts/library", authMiddleware, getWorkoutsLibrary);
trainerRouter.post("/workouts", authMiddleware, uploadWorkoutVideo, createMyWorkout);

export default trainerRouter;
