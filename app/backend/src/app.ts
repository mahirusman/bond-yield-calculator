import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from './config';
import { corsMiddleware } from './middleware/cors.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import bondRoutes from './routes/bond.routes';
import { httpLogger } from './utils/logger';
import { fail, notFound } from './utils/response';

export function createApp() {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(httpLogger);

  // Security
  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: config.rateLimitWindowMs,
      limit: config.rateLimitMax,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      handler: (_req, res) => {
        fail(res, 429, 'Too many requests. Please try again later.');
      },
    })
  );

  // CORS — allow frontend origin
  app.use(corsMiddleware);

  // Body parsing
  app.use(express.json({ limit: config.jsonBodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: config.jsonBodyLimit }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/v1', bondRoutes);

  // 404 handler
  app.use((req, res) => {
    notFound(res);
  });

  // Error handler — must be last
  app.use(errorMiddleware);

  return app;
}
