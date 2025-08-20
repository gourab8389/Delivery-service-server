import { Router } from 'express';
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  resetforgotPassword,
  getCurrentUser,
} from '../controllers/authControllers';
import { authenticateToken } from '../middleware/auth';
import {
  validate,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resetForgotPasswordSchema,
} from '../middleware/validation';

const router = Router();

// Public routes
router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-forgot-password', validate(resetForgotPasswordSchema), resetforgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// Protected routes
router.get('/user', authenticateToken, getCurrentUser);

export default router;