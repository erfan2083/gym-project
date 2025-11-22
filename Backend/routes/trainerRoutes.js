// Backend/routes/trainerRoutes.js
import express from "express";
import {
  listSpecialties,
  createTrainerProfile,
  uploadCertificateMiddleware,
  uploadCertificate
} from "../controllers/trainerController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const trainerRouter = express.Router();

// لیست تخصص‌ها (نیاز به لاگین ندارد — می‌تونی اگه خواستی محافظت کنی)
trainerRouter.get("/specialties", listSpecialties);

// ساخت پروفایل مربی (فقط کاربر لاگین کرده)
trainerRouter.post("/profile", authMiddleware, createTrainerProfile);

router.post("/upload-certificate",
  authMiddleware,
  uploadCertificateMiddleware,
  uploadCertificate
);



export default trainerRouter;
