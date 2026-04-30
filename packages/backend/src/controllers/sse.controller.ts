// SSEController - SSE stream endpoints for admin and table clients

import type { Request, Response } from 'express';
import { SSEService } from '../services/sse.service.js';

export class SSEController {
  constructor(private sseService: SSEService) {}

  /**
   * GET /api/stores/:storeId/sse/admin
   * Admin SSE stream - receives order updates for the store
   */
  adminStream = (req: Request, res: Response): void => {
    const storeId = Number(req.params.storeId);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Send initial connection event
    res.write(`event: connected\ndata: {"message":"Admin SSE connected"}\n\n`);

    this.sseService.addAdminClient(storeId, res);

    req.on('close', () => {
      this.sseService.removeAdminClient(storeId, res);
    });
  };

  /**
   * GET /api/stores/:storeId/sse/table/:tableId
   * Table SSE stream - receives order status changes for the table
   */
  tableStream = (req: Request, res: Response): void => {
    const storeId = Number(req.params.storeId);
    const tableId = Number(req.params.tableId);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Send initial connection event
    res.write(`event: connected\ndata: {"message":"Table SSE connected"}\n\n`);

    this.sseService.addTableClient(storeId, tableId, res);

    req.on('close', () => {
      this.sseService.removeTableClient(storeId, tableId);
    });
  };
}
