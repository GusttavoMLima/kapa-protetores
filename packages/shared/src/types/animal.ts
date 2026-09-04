export type Especie = 'cao' | 'gato' | 'outro';
export type Sexo = 'macho' | 'femea' | 'nao_sei';
export type Porte = 'pequeno' | 'medio' | 'grande';
export type CondicaoChegada = 'saudavel' | 'ferido' | 'debilitado';
export type TriState = 'sim' | 'nao' | 'nao_sei';
export type StatusAnimal = 'resgatado' | 'em_tratamento' | 'disponivel' | 'adotado';

export interface Animal {
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

export type CreateAnimalInput = Omit<Animal, 'id' | 'createdAt'>;
