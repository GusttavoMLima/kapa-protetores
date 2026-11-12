// Isolated API responses: this script never reaches the real database.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const output = path.resolve(__dirname, '../../.expo/personal-data-qa');
  fs.mkdirSync(output, { recursive: true });
  const base = process.env.KAPA_UI_URL || 'http://localhost:8081';
  try {
    for (const state of ['adult', 'minor', 'incomplete', 'register']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const user = { id: 'fixture-user', username: 'Ana Souza', email: 'fixture@example.com', role: 'adopter', rules: [], birthDate: state === 'incomplete' ? null : state === 'minor' ? '2015-01-01' : '1990-05-10', phone: state === 'incomplete' ? null : '19999998888' };
      if (state !== 'register') await context.addInitScript((user) => {
        const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
        localStorage.setItem('@kapa:auth-token', JSON.stringify(`fixture.${payload}.fixture`));
        localStorage.setItem('@kapa:user-data', JSON.stringify(user));
        localStorage.setItem('@kapa:has-adopter-profile', 'true');
      }, user);
      const writes = [];
      await context.route('**/api/**', async (route) => {
        const request = route.request();
        const pathname = new URL(request.url()).pathname;
        if (!['GET', 'OPTIONS'].includes(request.method())) writes.push({ pathname, data: request.postDataJSON() });
        let data = [];
        if (pathname.endsWith('/animals')) data = [{ id: 'fixture-pet', name: 'Luna', status: 'available' }];
        if (pathname.endsWith('/users/me')) data = user;
        if (pathname.endsWith('/volunteer-applications/mine')) data = null;
        if (pathname.endsWith('/users/create')) {
          assert.equal(writes.at(-1).data.birthDate, '2015-01-01');
          assert.equal(writes.at(-1).data.phone, '19999998888');
          return route.fulfill({ status: 400, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ message: 'Cadastro simulado para teste' }) });
        }
        return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }, body: JSON.stringify({ success: true, data }) });
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`${base}/${state === 'register' ? 'signUp' : 'adopet/fixture-pet/application'}`, { timeout: 180000 });
      await page.getByText('Cuidado, acolhimento e adoção responsável', { exact: true }).waitFor({ state: 'hidden', timeout: 30000 });
      if (state === 'register') {
        await page.getByLabel('Nome de usuário', { exact: true }).fill('Ana Souza');
        await page.getByLabel('E-mail', { exact: true }).fill('fixture@example.com');
        await page.getByLabel('Data de nascimento', { exact: true }).fill('2015-01-01');
        await page.getByLabel('Celular com DDD', { exact: true }).fill('(19) 99999-8888');
        await page.getByLabel('Senha', { exact: true }).fill('senha-fixture-123');
        await page.getByLabel('Confirmar senha', { exact: true }).fill('senha-fixture-123');
        await page.getByTestId('animated-splash-overlay').waitFor({ state: 'hidden', timeout: 30000 });
        await page.screenshot({ path: path.join(output, 'register-mobile.png') });
        await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
        await page.getByText('Cadastro simulado para teste', { exact: true }).waitFor();
        assert.equal(writes.length, 1);
      } else {
        if (state === 'adult') {
          await page.getByText('Ficha de adoção', { exact: true }).waitFor();
          assert.equal(await page.getByLabel('Data de nascimento', { exact: true }).inputValue(), '10/05/1990');
          assert.equal(await page.getByLabel('Telefone / WhatsApp com DDD', { exact: true }).inputValue(), '19999998888');
        } else {
          await page.getByRole('button', { name: 'Editar meu perfil', exact: true }).waitFor();
          assert.equal(await page.getByRole('button', { name: 'Enviar ficha', exact: true }).count(), 0);
          if (state === 'minor') await page.getByText(/É necessário ter 18 anos completos/).waitFor();
        }
        await page.getByTestId('animated-splash-overlay').waitFor({ state: 'hidden', timeout: 30000 });
        await page.screenshot({ path: path.join(output, `${state}-adoption-mobile.png`) });
        await page.goto(`${base}/volunteer`);
        if (state === 'adult') {
          await page.getByText('Seja Voluntário na Kapa', { exact: true }).waitFor();
          assert.equal(await page.getByLabel('Telefone / WhatsApp com DDD', { exact: true }).inputValue(), '19999998888');
        } else {
          await page.getByRole('button', { name: 'Editar meu perfil', exact: true }).waitFor();
          assert.equal(await page.getByRole('button', { name: 'Enviar inscrição de voluntariado', exact: true }).count(), 0);
        }
        assert.deepEqual(writes, []);
      }
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`${state}: personal data and eligibility OK`);
    }
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
