import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';
import { sendResponse } from '../utils/helpers';
import prisma from '../utils/database';
import { AuthRequest } from '../types';

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      sendResponse(res, 401, false, 'Access token required');
      return;
    }

    const decoded = verifyToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      sendResponse(res, 401, false, 'Invalid token - user not found');
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        sendResponse(res, 401, false, 'Invalid token');
        return;
      }
      if (error.name === 'TokenExpiredError') {
        sendResponse(res, 401, false, 'Token expired');
        return;
      }
    }
    
    sendResponse(res, 401, false, 'Authentication failed');
  }
};