import type { Adoption } from '@kapa/shared';
import { buildWhatsAppUrl, filterRequests, statusLabels } from '@/screens/adoptionRequests/model';

describe('modelo da caixa de solicitações', () => {
  it('busca por pet, normaliza acentos e prioriza análise sem modificar os dados originais', () => {
    const requests: Adoption[] = [
      { id: 'closed', adopterId: 'a', animalId: 'p', status: 'canceled', appliedAt: '2026-11-10', updatedAt: '2026-11-10' },
      { id: 'pending', adopterId: 'a', animalId: 'p', status: 'pending', appliedAt: '2026-11-09', updatedAt: '2026-11-09', adopter: { id: 'a', username: 'João', email: 'test@example.com', role: 'adopter', rules: [], createdAt: '2026-01-01' } },
    ];
    expect(filterRequests(requests, 'all', '').map((item) => item.id)).toEqual(['pending', 'closed']);
    expect(requests[0].id).toBe('closed');
    expect(filterRequests(requests, 'pending', ' JOAO ').map((item) => item.id)).toEqual(['pending']);
    expect(filterRequests(requests, 'canceled', '')).toHaveLength(1);
    expect(statusLabels.canceled).toBe('Cancelada');
  });
  it('gera contato brasileiro e recusa telefone incompatível', () => {
    expect(buildWhatsAppUrl('(19) 99999-8888', 'Ana', 'Luna')).toContain('https://wa.me/5519999998888?text=');
    expect(buildWhatsAppUrl('123', 'Ana', 'Luna')).toBeNull();
  });
});
