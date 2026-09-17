export type Species = 'dog' | 'cat' | 'other';

export type Genders = 'male' | 'female';

export type AnimalStatus = 'rescued' | 'treating' | 'available' | 'adopted';

export type Conditions = 'healthy' | 'injured' | 'debilitated';

export type TriageStatus = 'yes' | 'no' | 'unknown';

export interface AnimalPhoto {
  id: string;
  photoUrl: string;
  uploadedAt: string;
  animalId?: string | null;
}

export interface Animal {
  id: string;

  name: string;
  breed: string;

  species: Species;
  gender: Genders;

  weightKg: number;
  age: number;
  ageStage: number;

  size: number;
  energyLevel: number;
  kidFriendly: number;
  noiseLevel: number;

  apartmentFriendly: boolean;
  otherPetFriendly: boolean;

  healthCondition: Conditions;

  castrated: TriageStatus;
  vaccinated: boolean;
  dewormed: TriageStatus;

  rescuedAt: string;
  place: string;

  mood: string;
  observations?: string | null;

  status: AnimalStatus;

  createdAt: string;

  photos?: AnimalPhoto[];
}

export type CreateAnimalInput = Omit<Animal, 'id' | 'createdAt' | 'photos'>;

export type UpdateAnimalInput = Partial<CreateAnimalInput>;

export interface AnimalFilterParams {
  species?: Species;
  gender?: Genders;
  status?: AnimalStatus;
  search?: string;
}

// Legacy / Mobile form aliases
export type Especie = 'cao' | 'gato' | 'outro';
export type Sexo = 'macho' | 'femea' | 'nao_sei';
export type Porte = 'pequeno' | 'medio' | 'grande';
export type CondicaoChegada = 'saudavel' | 'ferido' | 'debilitado';
export type TriState = 'sim' | 'nao' | 'nao_sei';
export type StatusAnimal = 'resgatado' | 'em_tratamento' | 'disponivel' | 'adotado';
export type NivelEnergia = 'baixo' | 'moderado' | 'alto';
export type Temperamento = 'docil' | 'medroso' | 'sociavel' | 'agressivo';
export type Humor = 'tranquilo' | 'brincalhao' | 'assustado';
export type DoseStatus = 'sim' | 'nao';

export interface DoseRecord {
  status: DoseStatus;
  data?: string;
}

export interface LegacyAnimal {
  id: string;
  nome: string;
  raca?: string;
  especie: Especie;
  sexo: Sexo;
  porte: Porte;
  peso?: string;
  idadeAproximada: string;
  corPelagem: string;
  dataResgate: string;
  localResgate: string;
  condicaoChegada: CondicaoChegada;
  castrado: TriState;
  vacinado: TriState;
  vermifugado: TriState;
  v10PrimeiraDose?: DoseRecord;
  v10SegundaDose?: DoseRecord;
  vacinaRaiva?: DoseRecord;
  v10Doses?: DoseRecord[];
  vacinaRaivaDoses?: DoseRecord[];
  vermifugoDoses?: DoseRecord[];
  temperamento: Temperamento;
  nivelEnergia?: NivelEnergia;
  compativelCriancas?: TriState;
  compativelAnimais?: TriState;
  compativelApartamento?: TriState;
  humor?: Humor;
  publicacoes?: string;
  observacoes: string;
  fotoUri?: string;
  status: StatusAnimal;
  createdAt: string;
}

