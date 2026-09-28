// Run against Expo with Playwright available (or set PLAYWRIGHT_MODULE_PATH).
// All API responses are isolated fixtures; no shelter records are changed.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
    await context.addInitScript(() => {
      localStorage.setItem('@kapa:auth-token', JSON.stringify('isolated-browser-test'));
      localStorage.setItem('@kapa:user-data', JSON.stringify({ id: 'test-user', username: 'Equipe de teste', role: 'admin', email: 'test@example.com', rules: ['admin:*'] }));
    });
    const statuses = ['rescued', 'treating', 'available', 'adopted'];
    const animals = Array.from({ length: 15 }, (_, index) => ({
      id: `c${String(index + 1).padStart(24, '0')}`, name: ['Amora', 'Bento', 'Luna', 'Theo', 'Mel', 'Nina', 'Paçoca', 'Simba', 'Lola', 'Chico', 'Flor', 'Pipoca', 'Sol', 'Tito', 'Dora'][index],
      breed: 'Sem raça definida', species: index % 2 ? 'dog' : 'cat', gender: index % 2 ? 'male' : 'female',
      weightKg: 4.5, age: 2, ageStage: 0, size: 2, energyLevel: 3, kidFriendly: 4, noiseLevel: 2,
      apartmentFriendly: true, otherPetFriendly: true, healthCondition: 'healthy', castrated: 'yes', vaccinated: true,
      dewormed: 'unknown', rescuedAt: '2026-01-01T00:00:00.000Z', place: 'Abrigo', mood: 'Tranquilo', observations: '',
      status: statuses[index % statuses.length], createdAt: '2026-01-01T00:00:00.000Z', photos: [],
    }));
    let mode = 'normal';
    let patches = 0;
    await context.route('**/api/**', async (route) => {
      const url = new URL(route.request().url());
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, PATCH, POST, OPTIONS' };
      const respond = (data, status = 200) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify({ success: status === 200, data, error: status === 403 ? 'Acesso negado' : 'Erro de teste' }) });
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (mode === 'error') return respond(null, 500);
      if (mode === 'forbidden') return respond(null, 403);
      if (url.pathname === '/api/animals/management') {
        const query = url.searchParams;
        const available = mode === 'empty' ? [] : animals;
        let items = available.filter((animal) => (!query.get('search') || animal.name.toLowerCase().includes(query.get('search').toLowerCase())) && (!query.get('species') || animal.species === query.get('species')) && (!query.get('status') || animal.status === query.get('status')));
        if (query.get('sort') === 'name') items = items.toSorted((a, b) => a.name.localeCompare(b.name));
        const page = Number(query.get('page')); const pageSize = Number(query.get('pageSize'));
        return respond({ total: items.length, items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, counts: Object.fromEntries(statuses.map((status) => [status, available.filter((animal) => animal.status === status).length])) });
      }
      const animal = animals.find((item) => url.pathname.endsWith(`/${item.id}`));
      if (animal && route.request().method() === 'PATCH') {
        const patch = route.request().postDataJSON();
        assert.equal('ageStage' in patch, false);
        Object.assign(animal, patch); patches++;
      }
      return respond(animal || []);
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    const base = process.env.ANIMAL_UI_URL || 'http://localhost:8081';
    const output = path.resolve(__dirname, '../.expo/animal-management-qa');
    fs.mkdirSync(output, { recursive: true });
    await page.goto(`${base}/gestao/animais`, { timeout: 180000 });
    await page.getByRole('button', { name: 'Editar Amora', exact: true }).waitFor({ timeout: 180000 });
    await page.screenshot({ path: path.join(output, 'desktop.png'), fullPage: true });
    await page.getByRole('button', { name: 'Próxima', exact: true }).click();
    await page.getByText('13–15 de 15 animais', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Anterior', exact: true }).click();
    await page.getByRole('textbox', { name: 'Buscar animais por nome ou raça' }).fill('zzz');
    await page.getByText('Nenhum animal encontrado', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Limpar filtros', exact: true }).first().click();
    await page.getByRole('radio', { name: 'Gatos', exact: true }).click();
    await page.getByText('1–8 de 8 animais', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Editar Amora', exact: true }).click();
    const name = page.getByRole('textbox', { name: 'Nome *', exact: true });
    await name.fill('');
    await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
    await page.getByText('Informe o nome.', { exact: true }).waitFor();
    await name.fill('Amora atualizada');
    await page.getByRole('button', { name: 'Voltar à listagem', exact: true }).click();
    await page.getByText('Sair sem salvar?', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Continuar editando', exact: true }).click();
    mode = 'error';
    await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
    await page.getByText('Não foi possível salvar. Suas alterações foram mantidas; tente novamente.', { exact: true }).waitFor();
    assert.equal(await name.inputValue(), 'Amora atualizada');
    mode = 'normal';
    await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
    await page.getByText('Alterações salvas com sucesso. O cadastro já está atualizado para a equipe.', { exact: true }).waitFor();
    assert.equal(patches, 1);
    await page.screenshot({ path: path.join(output, 'editor.png'), fullPage: true });
    await page.getByRole('button', { name: 'Voltar à listagem', exact: true }).click();
    await page.getByRole('button', { name: 'Editar Amora atualizada', exact: true }).waitFor();
    assert.equal(await page.getByRole('radio', { name: 'Gatos', exact: true }).getAttribute('aria-checked'), 'true');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(output, 'mobile.png'), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    mode = 'error'; await page.reload();
    await page.getByRole('button', { name: 'Tentar novamente' }).waitFor();
    mode = 'empty'; await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await page.getByText('O próximo cuidado começa aqui', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(output, 'empty.png'), fullPage: true });
    mode = 'forbidden'; await page.reload();
    await page.getByText('Sua sessão expirou ou seu perfil não tem mais acesso à gestão. Entre novamente.', { exact: true }).waitFor();
    await context.close();
    const adopter = await browser.newContext();
    await adopter.addInitScript(() => {
      localStorage.setItem('@kapa:auth-token', JSON.stringify('isolated-adopter-test'));
      localStorage.setItem('@kapa:user-data', JSON.stringify({ role: 'adopter', username: 'Adotante' }));
    });
    const adopterPage = await adopter.newPage();
    await adopterPage.goto(`${base}/gestao/animais`);
    await adopterPage.getByText('Seu perfil não tem permissão para gerenciar animais.', { exact: true }).waitFor();
    await adopterPage.goto(`${base}/cadastro-animal`);
    await adopterPage.getByText('Seu perfil não tem permissão para gerenciar animais.', { exact: true }).waitFor();
    assert.deepEqual(pageErrors, []);
    console.log('PASS: desktop/mobile, search, filters, pagination, edit, validation, save retry, retained filters, empty/error/forbidden states and adopter guards.');
    console.log(`Screenshots: ${output}`);
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
