import type { VercelRequest, VercelResponse } from '@vercel/node';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});
app.use('/api/', limiter);

// Health check
app.get('/health', (_req: any, res: any) => {
  res.json({
    status: 'healthy',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (_req: any, res: any) => {
  res.json({
    message: 'FarmaDom API',
    version: '2.0.0',
    status: 'online',
  });
});

// Placeholder for API routes - will be extended
app.use('/api/v1', (_req: any, res: any) => {
  res.json({ message: 'API v1 endpoint' });
});

// 404 handler
app.use((_req: any, res: any) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

export default app;

