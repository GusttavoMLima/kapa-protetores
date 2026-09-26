import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { Server as HttpServer } from 'http';
import { ApiRouter } from './routes/ApiRouter';
import { ErrorHandler } from './middlewares/ErrorHandler';
import { AppError } from './errors';

export interface AppConfig {
  port: number;
  clientUrl: string;
}

export class App {
  public readonly app: Application;
  private readonly port: number;
  private readonly allowedOrigins: ReadonlySet<string>;
  private server?: HttpServer;

  constructor(
    private readonly apiRouter: Pick<ApiRouter, 'router'>,
    config: AppConfig,
  ) {
    this.app = express();
    this.port = config.port;
    this.allowedOrigins = new Set(
      config.clientUrl
        .split(',')
        .map((origin) => origin.trim().replace(/\/+$/, ''))
        .filter(Boolean),
    );

    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || this.allowedOrigins.has(origin.replace(/\/+$/, ''))) {
            return callback(null, true);
          }
          return callback(AppError.forbidden('Origem não permitida.'));
        },
        credentials: true,
      }),
    );

    this.app.disable('x-powered-by');
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  }

  private setupRoutes(): void {
    this.app.get('/', (_req: Request, res: Response) => {
      res.json({ message: 'Kapa Protetores API is running' });
    });

    this.app.use('/api', this.apiRouter.router);

    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({ success: false, error: 'Route not found' });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(ErrorHandler.handle);
  }

  public listen(): HttpServer {
    this.server = this.app.listen(this.port, () => {
      console.log(`🚀 Server running on http://localhost:${this.port}`);
      console.log(
        `🏥 Health check at http://localhost:${this.port}/api/health`,
      );
    });
    return this.server;
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        return resolve();
      }
      this.server.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}
