import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthenticatedRequest, JwtPayload } from '../types/index.js';
import { AppError } from './error-handler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'black-marble-secret-dev';

export function getJwtSecret(): string {
  return JWT_SECRET;
}

function extractAndVerifyToken(req: AuthenticatedRequest): JwtPayload {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new AppError(401, 'NO_TOKEN', 'No token provided');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new AppError(401, 'INVALID_TOKEN_FORMAT', 'Invalid token format');
  }

  try {
    const payload = jwt.verify(parts[1], JWT_SECRET) as JwtPayload;
    return payload;
  } catch {
    throw new AppError(401, 'TOKEN_INVALID', 'Token expired or invalid');
  }
}

export function adminAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const payload = extractAndVerifyToken(req);
    if (payload.role !== 'admin') {
      throw new AppError(403, 'ADMIN_REQUIRED', 'Admin access required');
    }
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}

export function tableAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const payload = extractAndVerifyToken(req);
    if (payload.role !== 'table') {
      throw new AppError(403, 'TABLE_REQUIRED', 'Table access required');
    }
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}

export function anyAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const payload = extractAndVerifyToken(req);
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}

export function verifyStoreAccess(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const pathStoreId = Number(req.params.storeId);
  const tokenStoreId = req.user?.storeId;

  if (!tokenStoreId || pathStoreId !== tokenStoreId) {
    next(new AppError(403, 'STORE_ACCESS_DENIED', 'Store access denied'));
    return;
  }
  next();
}
