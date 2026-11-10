import { buildContractWhatsAppUrl } from '@/utils/adoptionContract';

describe('buildContractWhatsAppUrl', () => {
  it('cria uma conversa no WhatsApp com o número brasileiro normalizado', () => {
    const url = buildContractWhatsAppUrl(
      '(19) 99999-1234',
      'Ana Souza',
      'Penny',
    );

    expect(url).toContain('https://wa.me/5519999991234');
    expect(decodeURIComponent(url ?? '')).toContain(
      'contrato de adoção de Penny',
    );
  });

  it('não cria link quando o telefone não é válido', () => {
    expect(buildContractWhatsAppUrl('123', 'Ana Souza', 'Penny')).toBeNull();
  });
});
