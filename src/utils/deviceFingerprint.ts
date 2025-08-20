import crypto from 'crypto';
import { Request } from 'express';

export const generateDeviceFingerprint = (req: Request): string => {
  const components = [
    req.headers['user-agent'] || '',
    req.ip || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
  ];
  
  return crypto.createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
};