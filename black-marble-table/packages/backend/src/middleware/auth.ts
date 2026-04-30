import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { UnauthorizedError, ForbiddenError } from '../errors/index.js';

/**
 * Admin 인증 미들웨어
 * Unit 1 (Foundation)에서 실제 JWT 검증 로직으로 교체 예정
 * 현재는 stub으로 헤더에서 storeId를 추출하여 사용
 */
export function authMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError());
  }

  // TODO: Unit 1에서 실제 JWT 검증으로 교체
  // Stub: Bearer 토큰에서 JSON payload를 디코딩 (테스트용)
  try {
    const token = authHeader.split(' ')[1];
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    req.auth = {
      storeId: payload.storeId,
      role: payload.role || 'admin',
      adminId: payload.adminId,
      tableId: payload.tableId,
    };
    next();
  } catch {
    next(new UnauthorizedError('유효하지 않은 인증 토큰입니다'));
  }
}

/**
 * Table 또는 Admin 인증 미들웨어
 * 고객(Table) 및 관리자(Admin) 모두 접근 가능한 엔드포인트용
 */
export function tableOrAdminAuthMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError());
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    req.auth = {
      storeId: payload.storeId,
      role: payload.role,
      adminId: payload.adminId,
      tableId: payload.tableId,
    };
    next();
  } catch {
    next(new UnauthorizedError('유효하지 않은 인증 토큰입니다'));
  }
}

/**
 * Admin 역할 검증 미들웨어
 * authMiddleware 이후에 사용
 */
export function adminOnly(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  if (!req.auth || req.auth.role !== 'admin') {
    return next(new ForbiddenError('관리자 권한이 필요합니다'));
  }
  next();
}
