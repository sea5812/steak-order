// SSEManager - Server-Sent Events connection pool management

import type { Response } from 'express';

export class SSEManager {
  private adminClients: Map<number, Set<Response>> = new Map();
  private tableClients: Map<string, Response> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  // ============================================================
  // Admin Client Management
  // ============================================================

  addAdminClient(storeId: number, res: Response): void {
    if (!this.adminClients.has(storeId)) {
      this.adminClients.set(storeId, new Set());
    }
    this.adminClients.get(storeId)!.add(res);
  }

  removeAdminClient(storeId: number, res: Response): void {
    const clients = this.adminClients.get(storeId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        this.adminClients.delete(storeId);
      }
    }
  }

  // ============================================================
  // Table Client Management
  // ============================================================

  addTableClient(storeId: number, tableId: number, res: Response): void {
    const key = `${storeId}:${tableId}`;
    const existing = this.tableClients.get(key);
    if (existing) {
      try {
        existing.end();
      } catch {
        // ignore if already closed
      }
    }
    this.tableClients.set(key, res);
  }

  removeTableClient(storeId: number, tableId: number): void {
    const key = `${storeId}:${tableId}`;
    this.tableClients.delete(key);
  }

  // ============================================================
  // Broadcasting
  // ============================================================

  broadcastToAdmin(storeId: number, event: string, data: unknown): void {
    const clients = this.adminClients.get(storeId);
    if (!clients) return;

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const failed: Response[] = [];

    for (const client of clients) {
      try {
        client.write(payload);
      } catch {
        failed.push(client);
      }
    }

    for (const client of failed) {
      clients.delete(client);
    }
    if (clients.size === 0) {
      this.adminClients.delete(storeId);
    }
  }

  broadcastToTable(storeId: number, tableId: number, event: string, data: unknown): void {
    const key = `${storeId}:${tableId}`;
    const client = this.tableClients.get(key);
    if (!client) return;

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    try {
      client.write(payload);
    } catch {
      this.tableClients.delete(key);
    }
  }

  // ============================================================
  // Heartbeat
  // ============================================================

  startHeartbeat(): void {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = setInterval(() => {
      // Admin clients heartbeat
      for (const [storeId, clients] of this.adminClients) {
        const failed: Response[] = [];
        for (const client of clients) {
          try {
            client.write(':heartbeat\n\n');
          } catch {
            failed.push(client);
          }
        }
        for (const client of failed) {
          clients.delete(client);
        }
        if (clients.size === 0) {
          this.adminClients.delete(storeId);
        }
      }

      // Table clients heartbeat
      for (const [key, client] of this.tableClients) {
        try {
          client.write(':heartbeat\n\n');
        } catch {
          this.tableClients.delete(key);
        }
      }
    }, 30_000);
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ============================================================
  // Stats (for debugging)
  // ============================================================

  getConnectionCount(): { admin: number; table: number } {
    let adminCount = 0;
    for (const clients of this.adminClients.values()) {
      adminCount += clients.size;
    }
    return {
      admin: adminCount,
      table: this.tableClients.size,
    };
  }
}
