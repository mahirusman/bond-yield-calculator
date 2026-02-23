import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsMiddleware } from './middleware/cors.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import bondRoutes from './routes/bond.routes';

export function createApp() {
  const app = express();

  // Security
  app.use(helmet());

  // CORS — allow frontend origin
  app.use(corsMiddleware);

  // Logging
  app.use(morgan('dev'));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/v1', bondRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Error handler — must be last
  app.use(errorMiddleware);

  return app;
}
