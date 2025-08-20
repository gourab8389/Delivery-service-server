import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';
import { sendResponse } from '../utils/helpers';
import prisma from '../utils/database';
import { AuthRequest } from '../types';
import { validateUserSession } from '../services/sessionService';

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
    
    // Validate session with device fingerprint
    const session = await validateUserSession(token, req);

    if (!session) {
      sendResponse(res, 401, false, 'Invalid token or device session');
      return;
    }

    // Update last used time
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    sendResponse(res, 401, false, 'Authentication failed');
  }
};