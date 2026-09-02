import type { CondicaoChegada, Especie, Porte, Sexo, TriState } from '../types/animal';

export interface Option<T> {
  value: T;
  label: string;
}

export const ESPECIE_OPTIONS: Option<Especie>[] = [
  { value: 'cao', label: 'Cão' },
  { value: 'gato', label: 'Gato' },
  { value: 'outro', label: 'Outro' },
];

export const SEXO_OPTIONS: Option<Sexo>[] = [
  { value: 'macho', label: 'Macho' },
  { value: 'femea', label: 'Fêmea' },
  { value: 'nao_sei', label: 'Não sei' },
];

export const PORTE_OPTIONS: Option<Porte>[] = [
  { value: 'pequeno', label: 'Pequeno' },
  { value: 'medio', label: 'Médio' },
  { value: 'grande', label: 'Grande' },
];

export const CONDICAO_CHEGADA_OPTIONS: Option<CondicaoChegada>[] = [
  { value: 'saudavel', label: 'Saudável' },
  { value: 'ferido', label: 'Ferido' },
  { value: 'debilitado', label: 'Debilitado' },
];

export const TRISTATE_OPTIONS: Option<TriState>[] = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
  { value: 'nao_sei', label: 'Não sei' },
];
