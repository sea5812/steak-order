import type { Request } from 'express';

export interface AdminPayload {
  storeId: number;
  adminId: number;
  role: 'admin';
}

export interface TablePayload {
  storeId: number;
  tableId: number;
  tableNumber: number;
  role: 'table';
}

export type JwtPayload = AdminPayload | TablePayload;

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
}

export type OrderStatus = 'pending' | 'preparing' | 'completed';
