// services/sessionService.ts
import prisma from '../utils/database';
import { generateDeviceFingerprint } from '../utils/deviceFingerprint';
import { Request } from 'express';

export const MAX_DEVICE_SESSIONS = 2;

export const createUserSession = async (
  userId: string,
  token: string,
  req: Request
) => {
  const deviceFingerprint = generateDeviceFingerprint(req);
  
  // Get limit from environment variable
  const maxDeviceSessions = parseInt(process.env.MAX_DEVICE_SESSIONS || '1');
  
  // Check current active sessions for this device
  const existingSessions = await prisma.userSession.findMany({
    where: {
      deviceFingerprint,
      isActive: true,
    },
    include: {
      user: true,
    },
  });

  // If device limit exceeded, deactivate oldest session
  if (existingSessions.length >= maxDeviceSessions) {
    const oldestSession = existingSessions
      .sort((a, b) => a.lastUsedAt.getTime() - b.lastUsedAt.getTime())[0];
    
    await prisma.userSession.update({
      where: { id: oldestSession.id },
      data: { isActive: false },
    });
  }

  // Create new session
  return await prisma.userSession.create({
    data: {
      userId,
      token,
      deviceFingerprint,
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || null,
    },
  });
};

export const validateUserSession = async (token: string, req: Request) => {
  const deviceFingerprint = generateDeviceFingerprint(req);
  
  return await prisma.userSession.findFirst({
    where: {
      token,
      deviceFingerprint,
      isActive: true,
    },
    include: {
      user: true,
    },
  });
};

export const deactivateUserSession = async (token: string) => {
  return await prisma.userSession.updateMany({
    where: { token },
    data: { isActive: false },
  });
};