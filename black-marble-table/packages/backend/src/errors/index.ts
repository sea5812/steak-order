export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code: string = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: string = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message, 400, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, code: string = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '인증이 필요합니다', code: string = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}
