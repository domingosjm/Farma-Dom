import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import { createServer } from 'http';
import path from 'path';

// Load environment variables
dotenv.config();

// Config & database
import config from './config/env';
import { testConnection } from './config/database';
import { setupSocketIO } from './config/socket';

// Middleware
import { errorHandler, AppError } from './middleware/errorHandler';

// Import routes
import authRouter from './routes/auth';
import consultasRouter from './routes/consultas';
import medicamentosRouter from './routes/medicamentos';
import pacotesRouter from './routes/pacotes';
import adminRouter from './routes/admin';
import pedidosRouter from './routes/pedidos';
import medicoRouter from './routes/medico';
import farmaciaRouter from './routes/farmacia';
import receitasRouter from './routes/receitas';
import transporteRouter from './routes/transporte';
import hospitalRouter from './routes/hospital';
import rodizioRouter from './routes/rodizio';

const app = express();
const httpServer = createServer(app);
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: config.CORS_ORIGINS.split(','),
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (uploads)
app.use('/uploads', express.static(path.resolve(config.UPLOAD_DIR)));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
});
app.use('/api/', limiter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'FarmaDom API',
    version: '2.0.0',
    status: 'online',
    docs: '/api/docs',
  });
});

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    await testConnection();
    res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected', timestamp: new Date().toISOString() });
  }
});

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/consultas', consultasRouter);
app.use('/api/v1/medicamentos', medicamentosRouter);
app.use('/api/v1/pacotes', pacotesRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/pedidos', pedidosRouter);
app.use('/api/v1/medico', medicoRouter);
app.use('/api/v1/farmacia', farmaciaRouter);
app.use('/api/v1/receitas', receitasRouter);
app.use('/api/v1/transporte', transporteRouter);
app.use('/api/v1/hospital', hospitalRouter);
app.use('/api/v1/rodizio', rodizioRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Centralized error handler
app.use(errorHandler);

// Start server (skip on Vercel serverless)
if (!isVercel) {
  const PORT = parseInt(config.PORT as string, 10);
  httpServer.listen(PORT, async () => {
    console.log('===================================');
    console.log('  🚀 FarmaDom Backend API v2.0');
    console.log('===================================');
    console.log(`  📍 URL: http://localhost:${PORT}`);
    console.log(`  🌍 Ambiente: ${config.NODE_ENV}`);
    console.log('  🗄️  DB: MySQL');
    console.log('===================================');

    // Setup Socket.IO
    setupSocketIO(httpServer);

    // Test database connection
    await testConnection();
  });
}

export default app;
