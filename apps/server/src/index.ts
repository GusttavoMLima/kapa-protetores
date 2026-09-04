import dotenv from 'dotenv';
import { App } from './App';
import { apiRouter } from './routes';

dotenv.config();

const port = Number(process.env.PORT) || 4000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:8081';

const application = new App(apiRouter, { port, clientUrl });

application.listen();

const handleShutdown = async (signal: string): Promise<void> => {
  console.log(
    `\n[Server]: ${signal} received, closing HTTP server gracefully...`,
  );
  await application.close();
  process.exit(0);
};

process.on('SIGINT', () => void handleShutdown('SIGINT'));
process.on('SIGTERM', () => void handleShutdown('SIGTERM'));

export { application };
