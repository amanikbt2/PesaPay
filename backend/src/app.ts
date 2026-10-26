import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { generalRateLimiter } from './middleware/rateLimiter';
import { apiRouter } from './routes';
import { logger } from './utils/logger';

export const app = express();

// Security Headers (configured to allow cross-origin requests for web client)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Cross-Origin Resource Sharing (allows web client on any dev port e.g. 8081, 8083)
app.use(
  cors({
    origin: true, // Automatically reflect request origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  })
);
app.options('*', cors());

// Payload size limit to prevent memory exhaustion
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Request tracing
app.use(requestIdMiddleware);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`);
  });
  next();
});

// Rate limiting
app.use(generalRateLimiter);

// Mount API routes
app.use('/api/v1', apiRouter);

// Root fallback / ping
app.get('/', (req, res) => {
  res.json({
    name: 'PesaPay API',
    version: '1.0.0',
    documentation: '/api/v1/health',
  });
});

// Centralized error handling
app.use(errorHandler);
