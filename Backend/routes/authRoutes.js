import express from "express";
import { signup, login } from "../controllers/authController.js";
import { createCoachProfile, updateCoachProfile } from "../controllers/couchController.js"


const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/CreateCouchProfile', createCoachProfile);
router.post('/UpdateCoachProfile', updateCoachProfile);

export default router;