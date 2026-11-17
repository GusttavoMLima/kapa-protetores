import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import test from 'node:test';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { verifyPicomatchPatches } from './patch-picomatch.mjs';

const require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, '..');
const lock = JSON.parse(readFileSync(resolve(root, 'package-lock.json'), 'utf8'));

test('every installed picomatch has the reviewed patch SHA-256', () => {
  assert.ok(verifyPicomatchPatches().length > 0);
});

test('verification rejects unpatched, changed and unreviewed installations', async () => {
  const fixture = mkdtempSync(resolve(tmpdir(), 'kapa-picomatch-test-'));
  try {
    mkdirSync(resolve(fixture, 'scripts'));
    mkdirSync(resolve(fixture, 'node_modules/picomatch/lib'), { recursive: true });
    const fixtureScript = resolve(fixture, 'scripts/patch-picomatch.mjs');
    writeFileSync(fixtureScript, readFileSync(new URL('./patch-picomatch.mjs', import.meta.url)));
    const fixtureLock = resolve(fixture, 'package-lock.json');
    writeFileSync(fixtureLock, JSON.stringify({ packages: { 'node_modules/picomatch': { version: '2.3.2' } } }));
    const { verifyPicomatchPatches: verify } = await import(pathToFileURL(fixtureScript).href);
    const parser = resolve(fixture, 'node_modules/picomatch/lib/parse.js');
    writeFileSync(parser, 'unpatched or changed parser');
    assert.throws(() => verify(), /sem correção verificada/);
    assert.throws(() => verify({ apply: true }), /sem correção verificada/);
    writeFileSync(parser, readFileSync(resolve(root, 'node_modules/picomatch/lib/parse.js')));
    assert.equal(verify({ apply: true }).length, 1);
    assert.equal(verify({ apply: true }).length, 1);
    writeFileSync(fixtureLock, JSON.stringify({ packages: { 'node_modules/picomatch': { version: '99.0.0' } } }));
    assert.throws(() => verify(), /Revisar patch/);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

for (const version of ['2.3.2', '4.0.7']) {
  const [installation] = Object.entries(lock.packages).find(([path, entry]) =>
    path.endsWith('/picomatch') && entry.version === version);
  const modulePath = resolve(root, installation);
  const picomatch = require(modulePath);

  test(`${version}: repeated star branches preserve ordinary matches`, () => {
    for (const pattern of ['+(*)', '+(*a)', '*(*a)', '+(a*)', '+(a*b)', '*(*.js)']) {
      assert.doesNotMatch(picomatch.makeRe(pattern).source, /\)[+*]/);
      for (const options of [{}, { dot: true }, { windows: true }, { bash: true }]) {
        const previous = picomatch(pattern, { ...options, maxExtglobRecursion: false });
        const patched = picomatch(pattern, options);
        for (const input of ['', 'a', 'b', 'aa', 'ab', 'ba', 'aab', '.a', 'test.js', 'a/b']) {
          assert.equal(patched(input), previous(input), `${pattern}: ${input}`);
        }
      }
    }
  });

  test(`${version}: malicious patterns terminate within two seconds`, () => {
    const result = spawnSync(process.execPath, ['-e', `
      const assert = require('node:assert/strict');
      const picomatch = require(${JSON.stringify(modulePath)});
      for (const options of [{}, {capture: true}]) {
        for (const pattern of ['+(*a)', '*(*a)', '+(*a)c', 'x+(*a)', '+(**a)', '+(a?*)', '+(*[ab])']) {
          const input = (pattern.startsWith('x') ? 'x' : '') + 'a'.repeat(50) + '/';
          assert.equal(picomatch(pattern, options)(input), false);
        }
        assert.equal(picomatch('+(*)', options)('a'.repeat(50) + '/'), false);
      }
    `], { timeout: 2000, encoding: 'utf8' });
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 0, result.stderr);
  });

  test(`${version}: literal stars retain their existing compilation`, () => {
    for (const pattern of ['+("*a")', '+(\\*a)', '+([*]a)']) {
      assert.equal(picomatch.makeRe(pattern).source,
        picomatch.makeRe(pattern, { maxExtglobRecursion: false }).source, pattern);
    }
  });
}
