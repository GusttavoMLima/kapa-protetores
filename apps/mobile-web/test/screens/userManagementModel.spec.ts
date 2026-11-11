import type { User } from '@kapa/shared';
import {
  DEFAULT_FILTERS,
  countByRole,
  filterAndSortUsers,
  formatDate,
  hasActiveFilters,
  initialsOf,
  paginate,
  readApiErrorMessage,
} from '@/screens/userManagement/model';

function buildUser(overrides: Partial<User>): User {
  return {
    id: 'user-x',
    role: 'adopter',
    rules: [],
    username: 'Pessoa',
    email: 'pessoa@kapa.test',
    createdAt: '2026-11-01T10:00:00.000Z',
    deactivatedAt: null,
    ...overrides,
  };
}

const ANA = buildUser({
  id: 'a',
  username: 'Ana Álvares',
  email: 'ana@kapa.test',
  role: 'admin',
  createdAt: '2026-11-03T10:00:00.000Z',
});
const BRUNO = buildUser({
  id: 'b',
  username: 'bruno Costa',
  email: 'bruno@kapa.test',
  role: 'volunteer',
  createdAt: '2026-11-01T10:00:00.000Z',
  deactivatedAt: '2026-11-05T10:00:00.000Z',
});
const CARLA = buildUser({
  id: 'c',
  username: 'Carla',
  email: 'carla@exemplo.org',
  createdAt: '2026-11-02T10:00:00.000Z',
});
const USERS = [BRUNO, CARLA, ANA];

describe('filterAndSortUsers', () => {
  it('ordena do mais recente para o mais antigo por padrão', () => {
    expect(filterAndSortUsers(USERS, DEFAULT_FILTERS).map((u) => u.id)).toEqual([
      'a',
      'c',
      'b',
    ]);
  });

  it('ordena por nome ignorando maiúsculas e acentos', () => {
    const sorted = filterAndSortUsers(USERS, { ...DEFAULT_FILTERS, sort: 'name' });

    expect(sorted.map((u) => u.id)).toEqual(['a', 'b', 'c']);
  });

  it('busca por nome ou e-mail sem diferenciar acentos nem maiúsculas', () => {
    const byName = filterAndSortUsers(USERS, { ...DEFAULT_FILTERS, search: ' ALVARES ' });
    const byEmail = filterAndSortUsers(USERS, { ...DEFAULT_FILTERS, search: 'exemplo.org' });

    expect(byName.map((u) => u.id)).toEqual(['a']);
    expect(byEmail.map((u) => u.id)).toEqual(['c']);
  });

  it('filtra por papel e por situação', () => {
    const volunteers = filterAndSortUsers(USERS, { ...DEFAULT_FILTERS, role: 'volunteer' });
    const inactive = filterAndSortUsers(USERS, { ...DEFAULT_FILTERS, status: 'inactive' });
    const active = filterAndSortUsers(USERS, { ...DEFAULT_FILTERS, status: 'active' });

    expect(volunteers.map((u) => u.id)).toEqual(['b']);
    expect(inactive.map((u) => u.id)).toEqual(['b']);
    expect(active.map((u) => u.id)).toEqual(['a', 'c']);
  });

  it('não altera a lista original', () => {
    const original = [...USERS];

    filterAndSortUsers(USERS, { ...DEFAULT_FILTERS, sort: 'name' });

    expect(USERS).toEqual(original);
  });
});

describe('hasActiveFilters', () => {
  it('ignora ordenação e espaços na busca', () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, sort: 'name', search: '   ' })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, search: 'ana' })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, role: 'admin' })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, status: 'inactive' })).toBe(true);
  });
});

describe('countByRole', () => {
  it('conta o total e cada papel', () => {
    expect(countByRole(USERS)).toEqual({
      all: 3,
      admin: 1,
      protector: 0,
      volunteer: 1,
      adopter: 1,
    });
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 23 }, (_, index) => index + 1);

  it('devolve a página pedida com os limites do intervalo', () => {
    const second = paginate(items, 2, 10);

    expect(second.items).toEqual(items.slice(10, 20));
    expect(second).toMatchObject({ page: 2, pages: 3, total: 23, from: 11, to: 20 });
  });

  it('ajusta páginas fora do intervalo e trata lista vazia', () => {
    expect(paginate(items, 99, 10)).toMatchObject({ page: 3, from: 21, to: 23 });
    expect(paginate(items, 0, 10).page).toBe(1);
    expect(paginate([], 1, 10)).toMatchObject({ items: [], pages: 1, total: 0, from: 0, to: 0 });
  });
});

describe('initialsOf', () => {
  it('usa a primeira e a última palavra, ou as duas primeiras letras', () => {
    expect(initialsOf('Maria da Silva')).toBe('MS');
    expect(initialsOf('  julia ')).toBe('JU');
    expect(initialsOf('')).toBe('?');
  });
});

describe('formatDate', () => {
  it('formata em pt-BR e protege contra datas inválidas', () => {
    expect(formatDate('2026-11-10T15:00:00.000Z')).toBe('10/11/2026');
    expect(formatDate('não é data')).toBe('—');
  });
});

describe('readApiErrorMessage', () => {
  it('usa a mensagem da API ou um texto padrão', () => {
    expect(readApiErrorMessage({ response: { data: { message: 'Mensagem da API' } } })).toBe(
      'Mensagem da API',
    );
    expect(readApiErrorMessage({ response: { data: { message: '' } } })).toMatch(
      /Não foi possível concluir/,
    );
    expect(readApiErrorMessage(null)).toMatch(/Não foi possível concluir/);
  });
});
