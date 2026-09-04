import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { Server as HttpServer } from 'http';
import { ApiRouter } from './routes/ApiRouter';
import { ErrorHandler } from './middlewares/ErrorHandler';

export interface AppConfig {
  port: number;
  clientUrl: string;
}

export class App {
  public readonly app: Application;
  private readonly port: number;
  private readonly clientUrl: string;
  private server?: HttpServer;

  constructor(
    private readonly apiRouter: ApiRouter,
    config: AppConfig
  ) {
    this.app = express();
    this.port = config.port;
    this.clientUrl = config.clientUrl;

    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    const allowedOrigins = [
      this.clientUrl,
      'http://localhost:19006',
      'http://localhost:8081',
    ];

    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          return callback(new Error(`Origin ${origin} not allowed by CORS`));
        },
        credentials: true,
      })
    );

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
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
      console.log(`🏥 Health check at http://localhost:${this.port}/api/health`);
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
