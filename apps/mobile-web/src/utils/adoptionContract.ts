import type { Adoption, Animal } from '@kapa/shared';

const speciesLabels: Record<Animal['species'], string> = {
  dog: 'Cão',
  cat: 'Gato',
  other: 'Outro',
};

const genderLabels: Record<Animal['gender'], string> = {
  male: 'Macho',
  female: 'Fêmea',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function documentHtml(adoption: Adoption): string | null {
  const application = adoption.application;
  const animal = adoption.animal;
  if (!application || !animal) return null;

  const adopterName = escapeHtml(application.fullName);
  const animalName = escapeHtml(animal.name);
  const address = escapeHtml(
    `${application.street}, ${application.number} - ${application.neighborhood}, ${application.city} - CEP ${application.postalCode}`,
  );
  const createdAt = new Date().toLocaleDateString('pt-BR');

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Contrato provisório - ${animalName}</title>
    <style>
      @page { margin: 22mm 18mm; }
      * { box-sizing: border-box; }
      body { color: #2b2622; font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.58; margin: 0; }
      h1 { color: #1f1b18; font-size: 19pt; letter-spacing: .2px; line-height: 1.25; margin: 0; text-align: center; }
      h2 { color: #1f1b18; font-size: 12pt; margin: 24px 0 8px; }
      p { margin: 0 0 12px; text-align: justify; }
      .brand { color: #f9801c; font-size: 22pt; font-weight: 800; letter-spacing: 1px; text-align: center; margin-bottom: 4px; }
      .details { background: #faf7f3; border-radius: 8px; padding: 14px 16px; }
      .details p { margin-bottom: 5px; }
      .signatures { display: grid; gap: 34px; grid-template-columns: 1fr 1fr; margin-top: 64px; text-align: center; }
      .line { border-top: 1px solid #5b534d; padding-top: 8px; }
      .footer { color: #746d67; font-size: 8.5pt; margin-top: 36px; text-align: center; }
    </style>
  </head>
  <body>
    <div class="brand">KAPA</div>
    <h1>Termo de adoção responsável</h1>

    <p>Por este termo, a <strong>Kapa Protetores</strong>, doravante denominada ABRIGO, registra o interesse de adoção responsável descrito abaixo.</p>

    <h2>1. Dados do adotante</h2>
    <div class="details">
      <p><strong>Nome:</strong> ${adopterName}</p>
      <p><strong>Data de nascimento:</strong> ${formatDate(application.birthDate)}</p>
      <p><strong>Telefone/WhatsApp:</strong> ${escapeHtml(application.phone)}</p>
      <p><strong>Endereço:</strong> ${address}</p>
    </div>

    <h2>2. Dados do animal</h2>
    <div class="details">
      <p><strong>Nome:</strong> ${animalName}</p>
      <p><strong>Espécie:</strong> ${speciesLabels[animal.species]}</p>
      <p><strong>Raça:</strong> ${escapeHtml(animal.breed || 'Sem raça definida')}</p>
      <p><strong>Sexo:</strong> ${genderLabels[animal.gender]}</p>
      <p><strong>Idade aproximada:</strong> ${animal.age} ano(s)</p>
    </div>

    <h2>3. Compromissos do adotante</h2>
    <p>O adotante declara que fornecerá alimentação adequada, abrigo, cuidados veterinários e proteção ao animal, comprometendo-se a não o abandonar, maltratar, transferir ou permitir acesso livre à rua sem prévia orientação do abrigo.</p>
    <p>O adotante concorda em manter contato com o abrigo quando solicitado e comunicar qualquer mudança relevante relacionada ao bem-estar do animal.</p>
    <p>Este documento registra os compromissos assumidos durante o processo de adoção responsável e deverá ser assinado pelas partes envolvidas.</p>

    <p style="margin-top: 32px; text-align: center;">${escapeHtml(application.city)}, ${createdAt}.</p>
    <div class="signatures">
      <div class="line">${adopterName}<br/>Adotante</div>
      <div class="line">Kapa Protetores<br/>Representante do abrigo</div>
    </div>
    <p class="footer">Documento gerado pela plataforma Kapa Protetores em ${createdAt}. Versão sujeita à validação institucional.</p>
  </body>
</html>`;
}

export function openAdoptionContract(
  adoption: Adoption,
  printImmediately = false,
): boolean {
  if (typeof window === 'undefined') return false;
  const content = documentHtml(adoption);
  if (!content) return false;

  const preview = window.open('', '_blank');
  if (!preview) return false;

  preview.document.open();
  preview.document.write(content);
  preview.document.close();

  if (printImmediately) {
    window.setTimeout(() => preview.print(), 250);
  }

  return true;
}

export function buildContractWhatsAppUrl(
  phone: string,
  adopterName: string,
  animalName: string,
): string | null {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (digits.length < 12 || digits.length > 13) return null;

  const message = `Olá, ${adopterName}! Somos da Kapa Protetores. O contrato de adoção de ${animalName} está pronto. Vamos encaminhar o arquivo para sua conferência.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function selectSignedContractPdf(): Promise<File | null> {
  if (typeof document === 'undefined') return Promise.resolve(null);

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,.pdf';
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}
