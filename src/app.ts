import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import { sendResponse } from './utils/helpers';


dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001;


app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.use('/api/auth', authLimiter, authRoutes);


app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'User Service' });
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});

export default app;