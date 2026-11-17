import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PICOMATCH_ADVISORY = 'GHSA-fc5q-39xc-vjpf';
const hashes = {
  '2.3.2': {
    original: '3a91656f440069aa8f8e15c9d695b9f6b2209df1eab2be8127c72cbcca45ff5f',
    patched: '85b780a87022cce396bedc0de011a29833959e56a13f5a79b2abc07779848cfe',
  },
  '4.0.7': {
    original: '4e1e05447668aa1e94366c5516a2bcd8f5fff800cc92b1d0cd7d77703b8618c4',
    patched: '0c5bd83a6e5c2db48532c4d4c7d39c69f7b41080153a35d39d4f544e846e1ff5',
  },
};

const digest = source => createHash('sha256').update(source).digest('hex');

// Backport of micromatch/picomatch#246, head
// f03bec2c02e46f063fbfdc161aae1d0f854b2565 (MIT); also applies to 4.0.7.
export function createPatchedParser(source) {
  const helper = [
    '// CVE-2026-112366: a literal/star branch absorbs its own repetition.',
    '// Based on micromatch/picomatch#246. Preserve the existing capture fallback.',
    'const isSelfRepeatingStarBranch = branch => {',
    "  return branch.includes('*') &&",
    "    !branch.includes('**') &&",
    '    !/[\\\\/"?()[\\]{}|!+@]/.test(branch);',
    '};', '', '',
    '// Preserve quoted/escaped stars and character classes as literals.',
    'const hasWildcardStar = branch => {',
    '  let escaped = false;',
    '  let quoted = false;',
    '  let bracket = 0;',
    '  for (const char of branch) {',
    '    if (escaped) { escaped = false; continue; }',
    "    if (char === '\\\\') { escaped = true; continue; }",
    '    if (char === \'"\' && bracket === 0) { quoted = !quoted; continue; }',
    '    if (quoted) continue;',
    "    if (char === '[') bracket++;",
    "    else if (char === ']') bracket = Math.max(0, bracket - 1);",
    "    else if (char === '*' && bracket === 0) return true;",
    '  }',
    '  return false;',
    '};', '', '',
  ].join('\n');
  const anchor = 'const analyzeRepeatedExtglob = (body, options) => {';
  source = source.replace(anchor, helper + anchor);
  const start = source.indexOf(anchor);
  const end = source.indexOf('\n};', start);
  const insertion = source.lastIndexOf('  return { risky: false };', end);
  source = source.slice(0, insertion) + [
    '  if (branches.length === 1 && isSelfRepeatingStarBranch(branches[0])) {',
    '    return options.capture === true ? { risky: true } : { risky: false, collapse: true };',
    '  }', '', '',
    '  // Complex wildcard branches also backtrack; use the existing literal fallback.',
    '  if (branches.length === 1 && hasWildcardStar(branches[0])) {',
    '    return { risky: true };',
    '  }', '', '',
  ].join('\n') + source.slice(insertion);
  return source.replace("    let output = token.close + (opts.capture ? ')' : '');", [
    "    if (analysis.collapse === true && (token.type === 'plus' || token.type === 'star')) {",
    "      token.close = token.type === 'plus' ? ')' : ')?';",
    '    }', '',
    "    let output = token.close + (opts.capture ? ')' : '');",
  ].join('\n'));
}

export function verifyPicomatchPatches({ apply = false, installedOnly = false } = {}) {
  const lock = JSON.parse(readFileSync(resolve(root, 'package-lock.json'), 'utf8'));
  const entries = Object.entries(lock.packages).filter(([path]) => path.endsWith('/picomatch'));
  if (entries.length === 0) throw new Error('Nenhuma instalação de picomatch encontrada.');
  const installations = [];
  for (const [path, entry] of entries) {
    if (installedOnly && !existsSync(resolve(root, path))) continue;
    const expected = hashes[entry.version];
    if (!expected) throw new Error(`Revisar patch de picomatch ${entry.version}: ${path}`);
    const file = resolve(root, path, 'lib/parse.js');
    let source = readFileSync(file, 'utf8');
    if (apply && digest(source) === expected.original) {
      source = createPatchedParser(source);
      if (digest(source) !== expected.patched) throw new Error(`Patch inesperado: ${path}`);
      writeFileSync(file, source);
    }
    if (digest(source) !== expected.patched) throw new Error(`Picomatch sem correção verificada: ${path}`);
    installations.push(path);
  }
  return installations;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const installedOnly = process.argv.includes('--production') || process.env.NODE_ENV === 'production' ||
    (process.env.npm_config_omit ?? '').split(/\s+/).includes('dev');
  console.log(`Picomatch: ${verifyPicomatchPatches({ apply: true, installedOnly }).length} cópia(s) corrigida(s) e verificadas.`);
}
