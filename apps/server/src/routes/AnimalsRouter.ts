import { Router } from 'express';
import { AnimalsController } from '../controllers/AnimalsController';

export class AnimalsRouter {
  public readonly router: Router = Router();

  constructor(private readonly controller: AnimalsController) {
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/', this.controller.getAll);
    this.router.get('/:id', this.controller.getById);
    this.router.post('/', this.controller.create);
  }
}
