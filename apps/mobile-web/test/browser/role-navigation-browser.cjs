// Isolated fixtures only. No requests reach the real API or Supabase.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const output = path.resolve(__dirname, '../../.expo/role-navigation-qa');
  fs.mkdirSync(output, { recursive: true });
  try {
    for (const role of ['admin', 'adopter']) {
      const user = { id: 'fixture-user', username: 'Equipe Kapa', email: 'fixture@example.com', role, rules: [], birthDate: '1990-01-01', phone: '19999998888' };
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      await context.addInitScript(({ user }) => {
        const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
        localStorage.setItem('@kapa:auth-token', JSON.stringify(`fixture.${payload}.fixture`));
        localStorage.setItem('@kapa:user-data', JSON.stringify(user));
        localStorage.setItem('@kapa:has-adopter-profile', 'true');
      }, { user });
      await context.route('**/api/**', async (route) => {
        const pathname = new URL(route.request().url()).pathname;
        assert.equal(['GET', 'OPTIONS'].includes(route.request().method()), true, 'QA must remain read only');
        let data = [];
        if (pathname.endsWith('/users/me/profile')) data = { ...user, favorites: [], events: [], counts: { favorites: 0, adoptions: 0, events: 0 } };
        else if (pathname.endsWith('/users/me')) data = user;
        else if (pathname.endsWith('/volunteer-applications/mine')) data = null;
        await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }, body: JSON.stringify({ success: true, data }) });
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const base = process.env.KAPA_UI_URL || 'http://localhost:8081';
      await page.goto(base, { timeout: 180000 });
      await page.getByRole('tab', { name: 'Perfil' }).waitFor({ timeout: 180000 });
      await page.getByText('Cuidado, acolhimento e adoção responsável', { exact: true }).waitFor({ state: 'hidden', timeout: 20000 });
      const tabs = await page.getByRole('tab').allTextContents();
      assert.deepEqual(tabs, role === 'admin' ? ['Gestão', 'Perfil'] : ['Adotar', 'Apoiar', 'Voluntariado', 'Perfil']);
      if (role === 'admin') {
        for (const title of ['Solicitações de adoção', 'Animais do abrigo', 'Organizar atividades', 'Candidaturas de voluntários']) {
          await page.getByText(title, { exact: true }).waitFor();
        }
        assert.equal(await page.getByText('Adotar Agora', { exact: true }).count(), 0);
      } else await page.getByText('Um encontro. Uma vida inteira.', { exact: true }).waitFor();
      await page.screenshot({ path: path.join(output, `${role}-desktop.png`) });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole('tab', { name: 'Perfil' }).waitFor();
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.screenshot({ path: path.join(output, `${role}-mobile.png`) });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No horizontal overflow');
      if (role === 'admin') {
        for (const [title, heading, file] of [
          ['Solicitações de adoção', 'Solicitações de adoção', 'adoptions'],
          ['Organizar atividades', 'Atividades da semana', 'activities'],
          ['Candidaturas de voluntários', 'Candidaturas de voluntários', 'applications'],
        ]) {
          await page.getByRole('button', { name: new RegExp(`^${title} -`) }).click();
          await page.getByRole('heading', { name: heading, exact: true }).waitFor();
          await page.screenshot({ path: path.join(output, `${file}-mobile.png`) });
          await page.goBack();
          await page.getByText('Gestão do abrigo', { exact: true }).waitFor();
        }
      }
      await page.getByRole('tab', { name: 'Perfil', exact: true }).click();
      await page.getByText('Editar Perfil', { exact: true }).waitFor();
      assert.equal(await page.getByText('Meus Favoritos', { exact: true }).count(), role === 'admin' ? 0 : 1);
      if (role === 'admin') {
        await page.goto(`${base}/support`);
        await page.getByText('Gestão do abrigo', { exact: true }).waitFor();
        assert.equal(await page.getByText('Apoie a Kapa', { exact: true }).count(), 0);
      } else {
        await page.goto(`${base}/gestao/solicitacoes`);
        await page.getByText('Um encontro. Uma vida inteira.', { exact: true }).waitFor();
        await page.getByText('Cuidado, acolhimento e adoção responsável', { exact: true }).waitFor({ state: 'hidden', timeout: 20000 });
        await page.getByRole('tab', { name: 'Apoiar', exact: true }).click();
        await page.getByText('Apoie a Kapa', { exact: true }).waitFor();
        await page.locator('img').evaluateAll((images) => Promise.all(images.map((image) => image.decode().catch(() => undefined))));
        await page.screenshot({ path: path.join(output, 'support-mobile.png') });
        await page.getByRole('tab', { name: 'Voluntariado', exact: true }).click();
        await page.getByText('Seja Voluntário na Kapa', { exact: true }).waitFor();
        await page.screenshot({ path: path.join(output, 'volunteer-mobile.png') });
      }
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`${role}: tabs, redirects, profile, responsive layout and runtime OK`);
    }
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
