import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import healthRouter from './routes/health.js';
import buyersRouter from './routes/buyers.js';
import emailsRouter from './routes/emails.js';
import configRouter from './routes/config.js';
import { getDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize SQLite database
getDb();

// Mount Routes
app.use('/api/health', healthRouter);
app.use('/api/buyers', buyersRouter);
app.use('/api/emails', emailsRouter);
app.use('/api/config', configRouter);

// Serve static frontend build if dist exists
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 Route for API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API Route not found',
    requestedUrl: req.originalUrl
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
    provider: err.provider || 'system'
  });
});

// Only start listening if run directly (not imported as a module in tests)
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain && process.env.NODE_ENV !== 'test') {
  const server = app.listen(config.port, () => {
    console.log(`[API Export] Server listening on http://localhost:${config.port}`);
    console.log(`[API Export] Health check: http://localhost:${config.port}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[API Export] Port ${config.port} is already in use. Please stop the process or set PORT in .env`);
    } else {
      console.error('[API Export] Server failed to start:', err);
    }
  });
}
