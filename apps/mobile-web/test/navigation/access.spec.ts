import type { UserRole } from '@kapa/shared';
import { canVisitScreen, homeForRole } from '@/navigation/access';

const roles: readonly UserRole[] = ['admin', 'protector', 'adopter', 'volunteer'];

describe('navegação por perfil', () => {
  it.each([
    ['/gestao/solicitacoes', ['admin']],
    ['/gestao/usuarios', ['admin']],
    ['/gestao/animais', ['admin', 'protector']],
    ['/gestao/animais/pet-1', ['admin', 'protector']],
    ['/gestao/voluntarios', ['admin', 'protector']],
    ['/manage-activities', ['admin', 'protector']],
    ['/activities', ['volunteer']],
    ['/adopet', ['adopter', 'volunteer']],
    ['/adopet/pet-1/application', ['adopter', 'volunteer']],
    ['/support', ['adopter', 'volunteer']],
    ['/pix', ['adopter', 'volunteer']],
    ['/volunteer', ['adopter', 'volunteer']],
    ['/my-favorites', ['adopter', 'volunteer']],
    ['/my-adoptions', ['adopter', 'volunteer']],
    ['/adopter-profile', ['adopter', 'volunteer']],
    ['/profile', roles],
    ['/edit-profile', roles],
    ['/my-events', roles],
  ] as const)('%s segue a matriz de acesso inclusive por URL', (path, allowed) => {
    for (const role of roles) {
      expect(canVisitScreen(role, path)).toBe(allowed.some((value) => value === role));
      expect(canVisitScreen(role, `${path}/`)).toBe(allowed.some((value) => value === role));
    }
  });

  it('não libera rotas sem perfil e inicia o adotante no catálogo', () => {
    expect(canVisitScreen(undefined, '/profile')).toBe(false);
    expect(homeForRole('adopter')).toBe('/adopet');
    expect(homeForRole('admin')).toBe('/');
  });
});
