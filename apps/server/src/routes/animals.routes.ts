import { InMemoryAnimalRepository } from '../repositories/InMemoryAnimalRepository';
import { AnimalService } from '../services/AnimalService';
import { AnimalsController } from '../controllers/AnimalsController';
import { AnimalsRouter } from './AnimalsRouter';

const animalRepository = new InMemoryAnimalRepository();
const animalService = new AnimalService(animalRepository);
const animalsController = new AnimalsController(animalService);
const animalsRouterInstance = new AnimalsRouter(animalsController);

export const animalsRouter = animalsRouterInstance;
export { AnimalsRouter };
