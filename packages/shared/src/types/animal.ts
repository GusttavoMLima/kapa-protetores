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

export interface LegacyAnimal {
  id: string;
  nome: string;
  especie: Especie;
  sexo: Sexo;
  porte: Porte;
  idadeAproximada: string;
  corPelagem: string;
  dataResgate: string;
  localResgate: string;
  condicaoChegada: CondicaoChegada;
  castrado: TriState;
  vacinado: TriState;
  vermifugado: TriState;
  temperamento: string;
  observacoes: string;
  fotoUri?: string;
  status: StatusAnimal;
  createdAt: string;
}

