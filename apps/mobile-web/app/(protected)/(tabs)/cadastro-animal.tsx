import { CadastroAnimalScreen } from '@/screens/cadastroAnimal';
import { AnimalAccess } from '@/screens/animalManagement/components';
import { FreshOnFocus } from '@/components/layout/FreshOnFocus';

export default function CadastroAnimalRoute() {
  return <FreshOnFocus><AnimalAccess><CadastroAnimalScreen /></AnimalAccess></FreshOnFocus>;
}
