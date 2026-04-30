// TableController - HTTP request handlers for table endpoints

import type { Request, Response, NextFunction } from 'express';
import { TableService } from '../services/table.service.js';
import { AppError } from '../errors/app-error.js';
import { validatePositiveInteger, validateRequiredString, validateDateString } from '../utils/validators.js';

export class TableController {
  constructor(private tableService: TableService) {}

  /**
   * POST /api/stores/:storeId/tables
   * Create a new table (Admin - US-A04)
   */
  create = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const storeId = Number(req.params.storeId);
      const tableNumber = validatePositiveInteger(req.body.table_number, 'table_number');
      const password = validateRequiredString(req.body.password, 'password', 4);

      // Hash password (using bcrypt from Unit 1)
      // For now, we accept password_hash directly or delegate to auth service
      // In integration, Unit 1's AuthService.hashPassword() will be used
      const bcrypt = require('bcrypt');
      const passwordHash = bcrypt.hashSync(password, 10);

      const result = this.tableService.createTable(storeId, tableNumber, passwordHash);

      // Return without password_hash
      const { password_hash, ...tableData } = result;
      res.status(201).json(tableData);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/stores/:storeId/tables/:id
   * Update a table (Admin - US-A04)
   */
  update = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const storeId = Number(req.params.storeId);
      const tableId = validatePositiveInteger(req.params.id, 'table_id');

      const updateData: { table_number?: number; password_hash?: string } = {};

      if (req.body.table_number !== undefined) {
        updateData.table_number = validatePositiveInteger(req.body.table_number, 'table_number');
      }

      if (req.body.password !== undefined) {
        const password = validateRequiredString(req.body.password, 'password', 4);
        const bcrypt = require('bcrypt');
        updateData.password_hash = bcrypt.hashSync(password, 10);
      }

      const result = this.tableService.updateTable(storeId, tableId, updateData);

      const { password_hash, ...tableData } = result;
      res.json(tableData);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/stores/:storeId/tables
   * Get all tables with session info (Admin - US-A03, US-A04)
   */
  getByStore = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const storeId = Number(req.params.storeId);
      const result = this.tableService.getTablesByStore(storeId);

      // Strip password_hash from response
      const sanitized = result.map((t) => {
        const { password_hash, ...tableData } = t.table;
        return {
          ...t,
          table: tableData,
        };
      });

      res.json(sanitized);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/stores/:storeId/tables/:id/complete
   * Complete table session (Admin - US-A04)
   */
  complete = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const storeId = Number(req.params.storeId);
      const tableId = validatePositiveInteger(req.params.id, 'table_id');

      const result = this.tableService.completeTable(storeId, tableId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/stores/:storeId/tables/:id/history
   * Get table order history (Admin - US-A04)
   */
  getHistory = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const storeId = Number(req.params.storeId);
      const tableId = validatePositiveInteger(req.params.id, 'table_id');

      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      if (startDate) validateDateString(startDate, 'startDate');
      if (endDate) validateDateString(endDate, 'endDate');

      const result = this.tableService.getTableHistory(storeId, tableId, startDate, endDate);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
