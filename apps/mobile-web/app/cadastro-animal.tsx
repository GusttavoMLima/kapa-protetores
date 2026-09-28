import { CadastroAnimalScreen } from '@/screens/cadastroAnimal';
import { AnimalAccess } from '@/screens/animalManagement/components';

export default function CadastroAnimalRoute() {
  return <AnimalAccess><CadastroAnimalScreen /></AnimalAccess>;
}
