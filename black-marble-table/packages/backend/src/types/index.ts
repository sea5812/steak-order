import type { Request } from 'express';

// ============================================================
// Auth Types
// ============================================================
export interface AuthPayload {
  storeId: string;
  role: 'admin' | 'table';
  adminId?: number;
  tableId?: number;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthPayload;
}

// ============================================================
// Menu DTOs
// ============================================================
export interface CreateCategoryDto {
  name: string;
}

export interface UpdateCategoryDto {
  name: string;
}

export interface CreateMenuDto {
  name: string;
  price: number;
  description?: string;
  categoryId: number;
}

export interface UpdateMenuDto {
  name: string;
  price: number;
  description?: string;
  categoryId: number;
}

// ============================================================
// API Response Types
// ============================================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
