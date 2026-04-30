import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { runMigrations } from './db/migrate.js';
import { sqlite } from './db/index.js';
import { authController } from './controllers/auth.controller.js';
import { adminController } from './controllers/admin.controller.js';
import { errorHandler } from './middleware/error-handler.js';
import { registerUnit3Routes } from './routes/index.js';
import { OrderController } from './controllers/order.controller.js';
import { TableController } from './controllers/table.controller.js';
import { SSEController } from './controllers/sse.controller.js';
import { OrderService } from './services/order.service.js';
import { TableService } from './services/table.service.js';
import { SSEService } from './services/sse.service.js';
import { OrderRepository } from './repositories/order.repository.js';
import { TableRepository } from './repositories/table.repository.js';
import { SSEManager } from './sse/sse-manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Run migrations on startup
runMigrations();

// Unit 1 Routes
app.use('/api', authController);
app.use('/api', adminController);

// Unit 3 Routes - Wire up dependencies
const sseManager = new SSEManager();
sseManager.startHeartbeat();
const orderRepository = new OrderRepository(sqlite);
const tableRepository = new TableRepository(sqlite);
const sseService = new SSEService(sseManager);
const orderService = new OrderService(sqlite, orderRepository, sseService);
const tableService = new TableService(sqlite, tableRepository, orderRepository, sseService);
const orderController = new OrderController(orderService);
const tableController = new TableController(tableService);
const sseController = new SSEController(sseService);

registerUnit3Routes(app, { orderController, tableController, sseController });

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Black Marble Table API' });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🖤 Black Marble Table API running on http://localhost:${PORT}`);
});
