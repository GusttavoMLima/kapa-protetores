import './config/env';
import { App } from './App';
import { apiRouter } from './routes';
import { PrismaService } from './database/PrismaService';
import { logger } from './config/logger';

const port = Number(process.env.PORT) || 4000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:8081';

const application = new App(apiRouter, { port, clientUrl });

void PrismaService.getInstance()
  .connect()
  .then(() => {
    logger.info('Successfully connected to PostgreSQL Pool');
  })
  .catch((err: unknown) => {
    logger.error({ err }, 'Failed to warm up PostgreSQL Pool');
  });

application.listen();

const handleShutdown = async (signal: string): Promise<void> => {
  logger.info(
    { signal },
    `${signal} received, closing HTTP server gracefully...`,
  );
  await application.close();
  await PrismaService.getInstance().disconnect();
  process.exit(0);
};

process.on('SIGINT', () => void handleShutdown('SIGINT'));
process.on('SIGTERM', () => void handleShutdown('SIGTERM'));

export { application };
