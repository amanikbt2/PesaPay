import { app } from './app';
import { env } from './config/env';
import { prisma } from './db';
import { logger } from './utils/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`=======================================================`);
  logger.info(` PesaPay API Server running on port ${env.PORT}`);
  logger.info(` Environment:      ${env.NODE_ENV}`);
  logger.info(` Payment Provider: ${env.PAYMENT_PROVIDER.toUpperCase()}`);
  logger.info(` Health Check:     http://localhost:${env.PORT}/api/v1/health`);
  logger.info(` Connectivity:     http://localhost:${env.PORT}/api/v1/connectivity`);
  logger.info(`=======================================================`);
});

// Graceful Shutdown
async function shutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database disconnected.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
