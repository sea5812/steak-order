import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/index.js';
import type { ApiResponse } from '../types/index.js';

/**
 * 글로벌 에러 핸들러 미들웨어
 * 모든 에러를 일관된 JSON 형식으로 응답
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // multer 에러 처리
  if (err.message === 'File too large') {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'IMAGE_TOO_LARGE',
        message: '이미지 파일 크기는 5MB 이하여야 합니다',
      },
    };
    res.status(400).json(response);
    return;
  }

  // 예상치 못한 에러
  console.error('Unexpected error:', err);
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '서버 내부 오류가 발생했습니다',
    },
  };
  res.status(500).json(response);
}
