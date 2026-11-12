// All reads and writes are isolated API fixtures. Supabase is never contacted.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const output = path.resolve(__dirname, '../../.expo/adoption-requests-qa');
  fs.mkdirSync(output, { recursive: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addInitScript(() => {
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
      localStorage.setItem('@kapa:auth-token', JSON.stringify(`fixture.${payload}.fixture`));
      localStorage.setItem('@kapa:user-data', JSON.stringify({ id: 'fixture-admin', username: 'Equipe Kapa', role: 'admin', email: 'fixture@example.com', rules: ['admin:*'] }));
    });
    const application = { fullName: 'Ana Souza', birthDate: '1990-01-01', phone: '19999998888', street: 'Rua das Flores', number: '20', neighborhood: 'Centro', city: 'Mogi Guaçu', postalCode: '13840000', housingType: 'house', housingSituation: 'own', residenceProtection: 'yes', hasChildren: 'yes', childrenAges: '7 e 10 anos', hasOtherPets: 'yes', otherPetsDetails: 'Uma gata adulta', residentsAgree: 'yes', freeStreetAccess: 'no', awareOfResponsibilities: 'yes' };
    const animal = { id: 'fixture-pet', name: 'Luna', photos: [] };
    const requests = ['pending', 'interviewing', 'approved', 'rejected', 'canceled'].map((status, index) => ({ id: `request-${index}`, status, adopterId: `user-${index}`, animalId: animal.id, appliedAt: '2026-11-10T15:00:00Z', updatedAt: '2026-11-10T15:00:00Z', animal, application: { ...application, fullName: ['Ana Souza', 'João Lima', 'Bia Santos', 'Carlos Alves', 'Dani Silva'][index] } }));
    const writes = [];
    let mode = 'normal';
    await context.route('**/api/**', async (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      const respond = (data, status = 200) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify({ success: status === 200, data }) });
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (pathname === '/api/adoptions' && request.method() === 'GET') return respond(mode === 'empty' ? [] : requests, mode === 'error' ? 500 : 200);
      const found = requests.find((item) => pathname.startsWith(`/api/adoptions/${item.id}/`));
      if (found && request.method() === 'PATCH') {
        const data = request.postDataJSON();
        writes.push({ id: found.id, data });
        Object.assign(found, data);
        if (data.contractSent) found.contractSentAt = '2026-11-10T16:00:00Z';
        return respond(found);
      }
      if (found && request.method() === 'POST') {
        assert.equal(pathname.endsWith('/signed-contract'), true);
        found.signedContractUploadedAt = '2026-11-10T16:30:00Z';
        found.signedContractFileName = 'contrato-fixture.pdf';
        writes.push({ id: found.id, upload: true });
        return respond(found);
      }
      assert.equal(['GET', 'OPTIONS'].includes(request.method()), true, 'Unexpected simulated write');
      return respond([]);
    });
    const page = await context.newPage();
    async function settle() {
      await page.evaluate(() => Promise.all(document.getAnimations().filter((animation) => animation.effect?.getTiming().iterations !== Infinity).map((animation) => animation.finished.catch(() => undefined))));
    }
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${process.env.KAPA_UI_URL || 'http://localhost:8081'}/gestao/solicitacoes`, { timeout: 180000 });
    await page.getByRole('button', { name: 'Analisar ficha de Ana Souza', exact: true }).waitFor();
    await page.getByTestId('animated-splash-overlay').waitFor({ state: 'hidden', timeout: 30000 });
    await page.screenshot({ path: path.join(output, 'list-desktop.png') });
    await page.getByRole('textbox', { name: 'Buscar por família, pet ou cidade' }).fill('joao');
    assert.equal(await page.getByRole('button', { name: 'Analisar ficha de Ana Souza', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Analisar ficha de João Lima', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Limpar busca', exact: true }).click();
    await page.getByRole('button', { name: 'Analisar ficha de Ana Souza', exact: true }).click();
    await page.getByText('Sobre a família', { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, 'review-desktop.png') });
    await page.getByRole('textbox', { name: 'Anotação interna da solicitação de Ana Souza' }).fill('Conversar sábado com a família.');
    await page.getByRole('button', { name: 'Salvar anotação', exact: true }).click();
    await page.getByText('Anotação salva para a equipe.', { exact: true }).waitFor();
    assert.deepEqual(writes.at(-1), { id: 'request-0', data: { adminNote: 'Conversar sábado com a família.' } });
    await page.getByRole('button', { name: 'Recusar ficha', exact: true }).click();
    await page.getByRole('button', { name: 'Voltar à análise', exact: true }).click();
    assert.equal(writes.length, 1);
    await page.getByRole('button', { name: 'Pré-aprovar e iniciar contato', exact: true }).click();
    await page.getByRole('button', { name: 'Marcar contrato como enviado', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Concluir adoção', exact: true }).isDisabled(), true);
    await page.getByRole('button', { name: 'Marcar contrato como enviado', exact: true }).click();
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Anexar contrato assinado (PDF)', exact: true }).click();
    await (await chooser).setFiles({ name: 'contrato-fixture.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nfixture\n%%EOF') });
    await page.getByText('Contrato assinado anexado', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Concluir adoção', exact: true }).click();
    await page.getByRole('button', { name: 'Confirmar adoção', exact: true }).click();
    await page.getByText('Contrato assinado arquivado', { exact: true }).waitFor();
    assert.equal(requests[0].status, 'approved');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Filtrar Em contato', exact: true }).click();
    await page.getByRole('button', { name: 'Analisar ficha de João Lima', exact: true }).click();
    const mobileCard = page.getByRole('button', { name: 'Recolher ficha de João Lima', exact: true }).locator('xpath=../..');
    await page.getByText('Sobre a família', { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, 'review-mobile.png') });
    assert.equal(await mobileCard.evaluate((element) => element.scrollWidth > element.clientWidth), false);
    await page.getByRole('button', { name: 'Recusar ficha', exact: true }).click();
    await settle();
    assert.equal(await page.getByRole('button', { name: 'Confirmar recusa', exact: true }).evaluate((element) => getComputedStyle(element).backgroundColor), 'rgb(186, 26, 26)');
    await page.screenshot({ path: path.join(output, 'confirmation-mobile.png') });
    await page.getByRole('button', { name: 'Confirmar recusa', exact: true }).click();
    await page.getByText('Nenhuma ficha com esses filtros', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Limpar filtros', exact: true }).click();
    await page.getByRole('button', { name: 'Voltar para Gestão do abrigo', exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, 'list-mobile.png') });
    mode = 'empty';
    await page.getByRole('button', { name: 'Atualizar solicitações', exact: true }).click();
    await page.getByText('O próximo novo lar começa aqui', { exact: true }).waitFor();
    mode = 'error';
    await page.getByRole('button', { name: 'Atualizar solicitações', exact: true }).click();
    await page.getByRole('button', { name: 'Tentar novamente', exact: true }).waitFor({ timeout: 30000 });
    mode = 'normal';
    await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
    await page.getByRole('heading', { name: 'João Lima', exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log('Desktop/mobile, search, filters, notes, cancel/confirm rejection, contract upload, completion, empty and retry OK. All API writes simulated.');
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
