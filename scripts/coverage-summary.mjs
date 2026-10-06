import { readFile, writeFile } from 'node:fs/promises';

const coveragePath = 'coverage/lcov.info';
const outputPath = 'coverage/summary.md';

const contents = await readFile(coveragePath, 'utf8');

function sum(metric) {
  return [...contents.matchAll(new RegExp(`^${metric}:(\\d+)$`, 'gm'))]
    .reduce((total, match) => total + Number(match[1]), 0);
}

function percentage(covered, found) {
  return found === 0 ? 'N/A' : `${((covered / found) * 100).toFixed(2)}%`;
}

const linesFound = sum('LF');
const linesHit = sum('LH');
const functionsFound = sum('FNF');
const functionsHit = sum('FNH');
const branchesFound = sum('BRF');
const branchesHit = sum('BRH');

const summary = [
  '<!-- kapa-coverage-summary -->',
  '## Cobertura de testes',
  '',
  '| Métrica | Coberta | Total | Percentual |',
  '| --- | ---: | ---: | ---: |',
  `| Linhas | ${linesHit} | ${linesFound} | ${percentage(linesHit, linesFound)} |`,
  `| Funções | ${functionsHit} | ${functionsFound} | ${percentage(functionsHit, functionsFound)} |`,
  `| Branches | ${branchesHit} | ${branchesFound} | ${percentage(branchesHit, branchesFound)} |`,
  '',
  `Relatório gerado para \`${process.env.GITHUB_SHA ?? 'execução local'}\`.`,
  '',
].join('\n');

await writeFile(outputPath, summary, 'utf8');
