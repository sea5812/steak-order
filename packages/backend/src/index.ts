import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { runMigrations } from './db/migrate.js';
import { authController } from './controllers/auth.controller.js';
import { adminController } from './controllers/admin.controller.js';
import { errorHandler } from './middleware/error-handler.js';

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

// Routes
app.use('/api', authController);
app.use('/api', adminController);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Black Marble Table API' });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🖤 Black Marble Table API running on http://localhost:${PORT}`);
});

export { app };
