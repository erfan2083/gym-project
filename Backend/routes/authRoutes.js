// routes/authRoutes.js
import express from 'express';
import {
  signupStart,
  signupVerify,
  signupComplete,
  login
} from '../controllers/authController.js';

const router = express.Router();

router.post('/signup/start', signupStart);
router.post('/signup/verify', signupVerify);
router.post('/signup/complete', signupComplete);
router.post('/login', login);

export default router;
