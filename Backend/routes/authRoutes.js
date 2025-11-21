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

authRouter.post('/signup/start', signupStart);
authRouter.post('/signup/verify', signupVerify);
authRouter.post('/signup/complete', signupComplete);
authRouter.post('/login', login);

authRouter.post('/password/forgot/start', forgotPasswordStart);
authRouter.post('/password/forgot/verify', forgotPasswordVerify);
authRouter.post('/password/forgot/complete', forgotPasswordComplete);

export default authRouter;
