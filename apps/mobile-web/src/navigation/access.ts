import type { UserRole } from '@kapa/shared';

export function isShelterStaff(role: UserRole | undefined): boolean {
  return role === 'admin' || role === 'protector';
}

export function canUseAdoption(role: UserRole | undefined): boolean {
  return role === 'adopter' || role === 'volunteer';
}

export function homeForRole(role: UserRole | undefined): '/' | '/adopet' {
  return role === 'adopter' ? '/adopet' : '/';
}

// Presentation policy. Every operation still requires server authorization.
export function canVisitScreen(role: UserRole | undefined, pathname: string): boolean {
  if (!role) return false;
  const path = pathname.replace(/\/$/, '') || '/';
  if (path === '/gestao/solicitacoes' || path === '/gestao/usuarios') return role === 'admin';
  if (path.startsWith('/gestao/') || path === '/manage-activities') return isShelterStaff(role);
  if (path === '/activities' || path === '/cuidados-animais') return role === 'volunteer';
  if (path === '/volunteer') return role === 'adopter' || role === 'volunteer';
  if (path === '/adopet' || path.startsWith('/adopet/') ||
      ['/support', '/lar-temporario', '/pix', '/my-favorites', '/my-adoptions', '/adopter-profile'].includes(path)) {
    return canUseAdoption(role);
  }
  return true;
}
