import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ALLOWLIST_URL = new URL('./audit-allowlist.json', import.meta.url);
const BLOCKING_SEVERITIES = new Set(['high', 'critical']);

function loadAllowlist() {
  const contents = readFileSync(ALLOWLIST_URL, 'utf8');
  const entries = JSON.parse(contents);
  return new Set(entries.map((entry) => entry.id));
}

function runNpmAudit() {
  const result = spawnSync('npm', ['audit', '--json'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });

  const stdout = result.stdout?.trim() ?? '';
  if (!stdout) {
    const detail = result.stderr?.trim() || result.error?.message || 'sem saída';
    throw new Error(`Falha ao executar "npm audit --json": ${detail}`);
  }

  return JSON.parse(stdout);
}

function collectBlockingAdvisories(report, allowedIds) {
  const blocking = new Map();

  for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
    for (const via of vulnerability.via ?? []) {
      if (typeof via === 'string') continue;
      if (!BLOCKING_SEVERITIES.has(via.severity)) continue;

      const match = (via.url ?? '').match(/GHSA-[a-z0-9-]+/i);
      const id = match ? match[0] : via.title;
      if (allowedIds.has(id)) continue;

      blocking.set(id, {
        id,
        severity: via.severity,
        title: via.title,
        package: vulnerability.name,
      });
    }
  }

  return [...blocking.values()];
}

function main() {
  const allowedIds = loadAllowlist();
  const report = runNpmAudit();
  const blocking = collectBlockingAdvisories(report, allowedIds);

  if (blocking.length > 0) {
    console.error('Advisories high/critical fora da allowlist:');
    for (const advisory of blocking) {
      const packageName = advisory.package ? ` (${advisory.package})` : '';
      console.error(` - [${advisory.severity}] ${advisory.id}${packageName}: ${advisory.title}`);
    }
    const allowlistPath = fileURLToPath(ALLOWLIST_URL);
    console.error(
      `\nSe o risco for aceito, documente o id em ${allowlistPath}; caso contrário, corrija a dependência.`,
    );
    process.exit(1);
  }

  console.log(
    `OK: nenhuma advisory high/critical fora da allowlist (${allowedIds.size} id(s) documentado(s)).`,
  );
}

main();
