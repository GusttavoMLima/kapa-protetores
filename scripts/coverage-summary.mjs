import { readFile, writeFile } from 'node:fs/promises';

const coveragePath = 'coverage/lcov.info';
const outputPath = 'coverage/summary.md';
const contents = await readFile(coveragePath, 'utf8');

function createMetrics() {
  return {
    statements: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    lines: { covered: 0, total: 0 },
  };
}

function packageName(filePath) {
  const normalizedPath = filePath.replaceAll('\\', '/');

  if (normalizedPath.startsWith('apps/mobile-web/')) return 'mobile-web';
  if (normalizedPath.startsWith('apps/server/')) return 'server';
  if (normalizedPath.startsWith('packages/shared/')) return 'shared';

  const [root, name] = normalizedPath.split('/');
  return name ? `${root}/${name}` : root;
}

function addMetric(target, metric, covered, total) {
  target[metric].covered += covered;
  target[metric].total += total;
}

function percentage({ covered, total }) {
  return total === 0 ? 'N/A' : `${((covered / total) * 100).toFixed(2)}%`;
}

const packages = new Map();
const total = createMetrics();
const records = contents.split(/^end_of_record\s*$/m);

for (const record of records) {
  const source = record.match(/^SF:(.+)$/m)?.[1]?.trim();
  if (!source) continue;

  const name = packageName(source);
  const metrics = packages.get(name) ?? createMetrics();
  const executableLines = [...record.matchAll(/^DA:\d+,(\d+)/gm)];
  const statementsCovered = executableLines.filter((match) => Number(match[1]) > 0).length;
  const statementsTotal = executableLines.length;
  const linesCovered = Number(record.match(/^LH:(\d+)$/m)?.[1] ?? 0);
  const linesTotal = Number(record.match(/^LF:(\d+)$/m)?.[1] ?? 0);
  const functionsCovered = Number(record.match(/^FNH:(\d+)$/m)?.[1] ?? 0);
  const functionsTotal = Number(record.match(/^FNF:(\d+)$/m)?.[1] ?? 0);
  const branchesCovered = Number(record.match(/^BRH:(\d+)$/m)?.[1] ?? 0);
  const branchesTotal = Number(record.match(/^BRF:(\d+)$/m)?.[1] ?? 0);

  addMetric(metrics, 'statements', statementsCovered, statementsTotal);
  addMetric(metrics, 'branches', branchesCovered, branchesTotal);
  addMetric(metrics, 'functions', functionsCovered, functionsTotal);
  addMetric(metrics, 'lines', linesCovered, linesTotal);
  packages.set(name, metrics);

  addMetric(total, 'statements', statementsCovered, statementsTotal);
  addMetric(total, 'branches', branchesCovered, branchesTotal);
  addMetric(total, 'functions', functionsCovered, functionsTotal);
  addMetric(total, 'lines', linesCovered, linesTotal);
}

const repositoryUrl = process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}`
  : undefined;
const commitSha = process.env.GITHUB_SHA;
const shortCommit = commitSha?.slice(0, 7) ?? 'execução local';
const commit = repositoryUrl && commitSha
  ? `[\`${shortCommit}\`](${repositoryUrl}/commit/${commitSha})`
  : `\`${shortCommit}\``;
const run = repositoryUrl && process.env.GITHUB_RUN_ID
  ? ` · [execução](${repositoryUrl}/actions/runs/${process.env.GITHUB_RUN_ID})`
  : '';

const rows = [...packages.entries()]
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([name, metrics]) => (
    `| **${name}** | ${percentage(metrics.statements)} | ${percentage(metrics.branches)} | ${percentage(metrics.functions)} | ${percentage(metrics.lines)} |`
  ));

rows.push(
  `| **Total** | **${percentage(total.statements)}** | **${percentage(total.branches)}** | **${percentage(total.functions)}** | **${percentage(total.lines)}** |`,
);

const summary = [
  '<!-- kapa-coverage-summary -->',
  '## Cobertura de testes',
  '',
  `Commit: ${commit}${run}`,
  '',
  '| Pacote | Statements | Branches | Functions | Lines |',
  '| --- | ---: | ---: | ---: | ---: |',
  ...rows,
  '',
  '_Comentário atualizado automaticamente a cada push._',
  '',
].join('\n');

await writeFile(outputPath, summary, 'utf8');
