import type {
  Conditions,
  Species,
  Genders,
  TriageStatus,
  Especie,
  Sexo,
} from '../types/animal';

export interface Option<T> {
  value: T;
  label: string;
}

export const ESPECIE_OPTIONS: Option<Species>[] = [
  { value: 'dog', label: 'Cão' },
  { value: 'cat', label: 'Gato' },
  { value: 'other', label: 'Outro' },
];

export const SEXO_OPTIONS: Option<Genders>[] = [
  { value: 'male', label: 'Macho' },
  { value: 'female', label: 'Fêmea' },
];

export const ESPECIE_PT_OPTIONS: Option<Especie>[] = [
  { value: 'cao', label: 'Cão' },
  { value: 'gato', label: 'Gato' },
];

export const SEXO_PT_OPTIONS: Option<Sexo>[] = [
  { value: 'macho', label: 'Macho' },
  { value: 'femea', label: 'Fêmea' },
];

export const PORTE_OPTIONS: Option<number>[] = [
  { value: 1, label: 'Muito Pequeno' },
  { value: 2, label: 'Pequeno' },
  { value: 3, label: 'Médio' },
  { value: 4, label: 'Grande' },
  { value: 5, label: 'Gigante' },
];

export const CONDICAO_CHEGADA_OPTIONS: Option<Conditions>[] = [
  { value: 'healthy', label: 'Saudável' },
  { value: 'injured', label: 'Ferido' },
  { value: 'debilitated', label: 'Debilitado' },
];

export const TRISTATE_OPTIONS: Option<TriageStatus>[] = [
  { value: 'yes', label: 'Sim' },
  { value: 'no', label: 'Não' },
  { value: 'unknown', label: 'Não sei' },
];
