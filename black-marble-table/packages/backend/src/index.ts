import express from 'express';
import { resolve } from 'path';
import { createMenuRouter } from './controllers/menu.controller.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// Middleware
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (이미지 업로드)
app.use('/uploads', express.static(resolve(process.cwd(), 'uploads')));

// ============================================================
// Routes
// ============================================================
app.use('/api/stores/:storeId', createMenuRouter());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================
// Error Handler (must be last)
// ============================================================
app.use(errorHandler);

// ============================================================
// Server Start
// ============================================================
app.listen(PORT, () => {
  console.log(`🥩 Black Marble Table API Server running on port ${PORT}`);
});

export { app };
