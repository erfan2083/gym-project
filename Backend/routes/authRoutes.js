// routes/authRoutes.js
import express from 'express';
import {
  signupStart,
  signupVerify,
  signupComplete,
  login,
  forgotPasswordStart,
  forgotPasswordVerify,
  forgotPasswordComplete,
} from '../controllers/authController.js';

const authRouter = express.Router();

router.post('/signup/start', signupStart);
router.post('/signup/verify', signupVerify);
router.post('/signup/complete', signupComplete);
router.post('/login', login);

router.post('/password/forgot/start', forgotPasswordStart);
router.post('/password/forgot/verify', forgotPasswordVerify);
router.post('/password/forgot/complete', forgotPasswordComplete);

export default authRouter;
