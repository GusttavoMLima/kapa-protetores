# CI/CD do Kapa

Este documento descreve o pipeline de integração contínua já ativo e o plano de entrega contínua do monorepo.

## Estado atual

- **CI:** ativo no GitHub Actions.
- **CD:** workflow preparado em `.github/workflows/cd.yml`; permanece sem executar deploy até os provedores e secrets serem configurados e o CI passar.
- **Ambientes previstos:** homologação a partir de `development` e produção a partir de `main`.

## Integração contínua

O workflow está em [`.github/workflows/quality.yml`](../.github/workflows/quality.yml).

### Gatilhos

| Evento | Execução |
| --- | --- |
| Pull Request | Executa o CI para qualquer branch de destino |
| Push em `development` | Executa o CI da homologação |
| Push em `main` | Executa o CI da produção |
| Push em outra branch | Não executa; a validação acontece quando houver Pull Request |
| Disparo manual | Disponível por `workflow_dispatch` |

Execuções do mesmo PR ou branch usam concorrência. Quando chega um commit mais novo, a execução anterior é cancelada.

### Checks apresentados no GitHub

| Check | Etapas internas |
| --- | --- |
| `CI / ESLint` | Instalação reproduzível com `npm ci`, ESLint, geração do Prisma Client e type-check |
| `CI / Testes` | Segredo JWT efêmero, testes automatizados, build da API e build web |
| `CI / Cobertura` | Testes com LCOV, artefato de cobertura e comentário no PR |
| `CI / Dockerfile (build base)` | Build completo da imagem de runtime da API |
| `CI / Segurança (Semgrep + Trivy + npm audit)` | Gate de auditoria npm (`scripts/audit-gate.mjs` + allowlist), Semgrep, Trivy (com `.trivyignore`) e Gitleaks |
| `CI / SonarCloud` | Análise estática e espera pelo Quality Gate do SonarCloud, consumindo a cobertura do job `Cobertura` (executa nos PRs do próprio repositório e em pushes para `main`) |

As ferramentas de segurança continuam executando mesmo quando uma etapa anterior encontra um problema, permitindo consultar todos os resultados da execução.

O check `SonarCloud` roda **depois** do job `Cobertura`, baixa o artefato `lcov-report` e aguarda por até cinco minutos o resultado do Quality Gate. O próprio job falha quando o gate reprova, inclusive quando a cobertura do código novo fica abaixo de 80%. O plano atual do SonarCloud não permite consultar o Quality Gate de branches secundárias; por isso, o job executa nos Pull Requests e nos pushes para `main`, mas é pulado no push de `development`. Antes do merge, o PR já precisa ter passado pelo Quality Gate; depois do merge, os demais checks são executados novamente sobre o commit integrado. As `sonar.coverage.exclusions` em [`sonar-project.properties`](../sonar-project.properties) excluem arquivos sem teste unitário (infra de banco/Redis e telas do app), evitando penalizar código exercitado apenas manualmente/integralmente.

### Gate de auditoria de dependências

A auditoria deixou de ser um `npm audit` bruto (que falhava por vulnerabilidades sem correção na linha atual do Prisma/Expo). Agora `scripts/audit-gate.mjs` roda `npm audit --json` e **falha apenas em advisories high/critical que não estejam na allowlist** [`scripts/audit-allowlist.json`](../scripts/audit-allowlist.json). Assim, novas vulnerabilidades bloqueiam o CI, enquanto as aceitas ficam documentadas (com motivo). Ao corrigir uma dependência, remova o id correspondente da allowlist.

O job `Segurança` também roda o **Trivy**, que tem o próprio ignore em [`.trivyignore`](../.trivyignore) (mesmos CVEs aceitos, já que o Trivy não lê a allowlist do npm). Diretórios `node_modules` são excluídos da travessia: vulnerabilidades das dependências continuam sendo analisadas pelo `package-lock.json`, enquanto Dockerfiles e outras configurações internas de pacotes externos não são atribuídos ao projeto. O **Semgrep** roda com `--error`; em PRs usa `--baseline-commit` e eventuais falsos positivos são suprimidos pontualmente com `# nosemgrep`.

### Cobertura no Pull Request

Em PRs criados dentro do próprio repositório, o workflow publica um comentário novo a cada push com:

- commit analisado;
- link para a execução do GitHub Actions;
- cobertura de statements, branches, functions e lines;
- resultados agrupados em `mobile-web`, `server`, `shared` e total.

O relatório completo `coverage/lcov.info` permanece disponível como artefato por sete dias. PRs de forks executam a cobertura, mas não recebem permissão para publicar comentários.

### Proteção das branches

Configure regras para `development` e `main` exigindo os seis checks listados acima. Para `development`, mantenha também aprovação de outro desenvolvedor, discussões resolvidas e Squash and merge, conforme o [`CONTRIBUTING.md`](../CONTRIBUTING.md).

### Dependabot

O arquivo [`.github/dependabot.yml`](../.github/dependabot.yml) procura atualizações npm e GitHub Actions semanalmente. Existe uma espera de sete dias depois da publicação de uma versão para reduzir o risco de adotar imediatamente uma versão comprometida ou instável.

## Entrega contínua planejada

```mermaid
flowchart LR
    PR[Pull Request] --> CI[Seis checks de CI]
    CI -->|aprovado e merge| DEV[development]
    DEV --> WEBH[Web de homologação no Vercel]
    DEV --> APIH[API de homologação no Render]
    DEV --> MAIN[PR de promoção]
    MAIN -->|merge e CI aprovado| WEBP[Web de produção no Vercel]
    MAIN -->|merge e CI aprovado| APIP[API de produção no Render]
```

### Provedores

- **Web:** Vercel, recebendo a exportação web do Expo gerada por `npm run build:web`.
- **API:** Render, construindo [`apps/server/Dockerfile`](../apps/server/Dockerfile) com o contexto na raiz do monorepo.
- **Mobile:** EAS Build/Submit em uma etapa posterior, quando o fluxo de publicação nas lojas estiver definido.

O Expo gera uma aplicação web estática que pode ser hospedada no Vercel. No Render, o auto-deploy deve permanecer desligado porque o workflow aciona um deploy hook somente depois que os checks passam.

### Workflow de deploy

O workflow [`.github/workflows/cd.yml`](../.github/workflows/cd.yml) é acionado somente quando o workflow `CI` termina em `development` ou `main`. Ele exige que a execução tenha vindo de um push e que todos os checks tenham concluído com sucesso.

O job:

1. obtém exatamente o commit aprovado pelo CI;
2. lê os secrets do ambiente `staging` ou `production`;
3. instala as dependências (`npm ci`) e aplica as migrations do Prisma (`prisma migrate deploy`) usando `DATABASE_URL`/`DIRECT_URL` do ambiente;
4. aciona o deploy do mesmo commit da API pelo deploy hook do Render;
5. aguarda `API_HEALTH_URL` responder `HTTP 200` e informar exatamente o SHA aprovado pelo CI (timeout de 20 minutos);
6. gera o build com Vercel CLI fixado na versão `62.5.0`;
7. publica o web no Vercel somente depois que a nova API estiver saudável;
8. publica um resumo do deploy (ambiente, branch, commit, URL e resposta de `/health`) no *Step Summary* da execução do GitHub Actions.

O endpoint `GET /api/health` devolve o campo `data.commit` com o SHA em execução — resolvido por `GIT_SHA` (quando definido no ambiente) ou por `RENDER_GIT_COMMIT` (injetado pelo Render no deploy). Isso permite confirmar *qual* commit está no ar.

Migrations e deploy usam o mesmo environment do GitHub, então há **uma única aprovação** em produção, cobrindo os dois.

O workflow `CD` precisa existir na branch padrão do GitHub para receber eventos `workflow_run`. A primeira ativação acontece depois que esta configuração for promovida para `main`.

Nesse tipo de evento, o `GITHUB_REF` do workflow de CD aponta para a branch padrão, mesmo quando o CI que o originou executou em `development`. Por isso, não configure uma regra de branch selecionada que permita apenas `development` no ambiente `staging`: ela bloquearia o deploy. A origem é controlada pelos filtros `branches` do evento e pela validação de `github.event.workflow_run.head_branch` no workflow.

### Ambientes

| Branch | Ambiente GitHub | Destino | Comportamento |
| --- | --- | --- | --- |
| `development` | `staging` | Vercel + Render de homologação | Deploy automático após o CI aprovado |
| `main` | `production` | Vercel + Render de produção | Deploy após o CI aprovado e aprovação do ambiente, quando disponível no plano do repositório |
| Branch de trabalho/PR | nenhum secret de produção | Preview web opcional | Nunca acessa credenciais de produção |

Homologação e produção devem usar bancos, Redis, buckets S3, chaves JWT e credenciais Google separados.

### Configuração dos provedores

No Vercel, crie um projeto para cada ambiente com a raiz do monorepo e configure:

- Framework Preset: `Other`;
- Install Command: `npm ci`;
- Build Command: `npm run build:web`;
- Output Directory: `apps/mobile-web/dist`.

Use projetos sem auto-deploy pelo Git ou desative os builds automáticos da integração para não publicar antes do CI nem criar deploys duplicados. Copie os IDs do projeto e da organização para os respectivos ambientes do GitHub.

No Render, crie um Web Service Docker para cada ambiente com:

- repositório do Kapa;
- Docker Context: `.`;
- Dockerfile Path: `apps/server/Dockerfile`;
- Health Check Path: `/api/health`;
- Auto-Deploy: `Off`;
- deploy hook exclusivo para o ambiente.

O deploy hook é um segredo. Armazene-o somente como `RENDER_DEPLOY_HOOK_URL` no ambiente correspondente do GitHub.

Para o banco, crie **dois projetos Supabase** (homologação e produção). Cada projeto fornece:

- `DATABASE_URL`: conexão via pooler (usada pela API em runtime);
- `DIRECT_URL`: conexão usada pelas migrations do Prisma.

As migrations rodam no próprio workflow de deploy (`prisma migrate deploy`), antes de acionar o Render — por isso o banco precisa estar acessível a partir do runner do GitHub Actions. Como os runners do GitHub Actions e o Render usam IPv4, em projetos Supabase que não oferecem conexão direta por IPv4, use a URI do **Session pooler**, porta `5432`, tanto em `DATABASE_URL` quanto em `DIRECT_URL`, acrescentando `?sslmode=require`. Cadastre os valores nos environments `staging` e `production`, com bancos distintos por ambiente.

### Onde cada valor é configurado

| Onde | Para que serve | Variáveis |
| --- | --- | --- |
| GitHub Environment (`staging`/`production`) | O que o workflow usa para migrar e deployar | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RENDER_DEPLOY_HOOK_URL`, `API_HEALTH_URL`, `DATABASE_URL`, `DIRECT_URL` |
| Render (runtime da API) | Variáveis que a API lê em execução | `NODE_ENV`, `PORT`, `CLIENT_URL`, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `ACCESS_TOKEN_TTL_SECONDS`, `SALT_SECRET`, `REDIS_URL`, `S3_ENDPOINT`, `S3_PUBLIC_URL`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `GOOGLE_*` |
| Vercel (build do web) | Variáveis embutidas no bundle | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` |

`API_HEALTH_URL` é a URL pública de health do ambiente (ex.: `https://kapa-api-hml.onrender.com/api/health`); o CD faz polling até ela responder HTTP 200 com o mesmo SHA aprovado pelo CI. `CLIENT_URL` deve conter as origens web exatas do ambiente (CORS), sem barra final.

Não defina `GIT_SHA` manualmente no Render. O serviço usa `RENDER_GIT_COMMIT`, injetado automaticamente a cada deploy, para informar o commit atual em `/api/health`.

### Bloqueios antes de ativar o CD

1. Garantir que o check `Segurança` esteja verde — as vulnerabilidades pré-existentes estão documentadas na allowlist (`scripts/audit-allowlist.json`) e apenas advisories novas bloqueiam.
2. Criar os projetos de homologação e produção no Vercel, no Render e no Supabase.
3. Definir Redis e armazenamento S3 separados por ambiente.
4. Configurar os domínios e as origens CORS exatas.
5. Cadastrar secrets nos ambientes do GitHub e nos provedores, sem copiar arquivos `.env`.

### Variáveis da API por ambiente

| Grupo | Variáveis |
| --- | --- |
| Runtime | `NODE_ENV`, `PORT`, `CLIENT_URL` |
| PostgreSQL | `DATABASE_URL`, `DIRECT_URL` |
| Autenticação | `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `ACCESS_TOKEN_TTL_SECONDS`, `SALT_SECRET` |
| Redis | `REDIS_URL`, usando `rediss://` quando o provedor oferecer TLS |
| S3 | `S3_ENDPOINT`, `S3_PUBLIC_URL`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID` |

Variáveis `SEED_ADMIN_*` não devem permanecer no runtime de produção depois do uso controlado. O workflow de deploy aplica as migrations do Prisma automaticamente antes de acionar a API, mas **não** executa seed.

### Variáveis públicas do web

- `EXPO_PUBLIC_API_URL`, sempre HTTPS e terminando na API correta;
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`;
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`;
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.

Variáveis com prefixo `EXPO_PUBLIC_` são incorporadas ao bundle e não podem conter segredos.

## Sequência de implementação do CD

1. Garantir que o check `Segurança` passe (allowlist documentada de vulnerabilidades pré-existentes).
2. Criar os projetos Supabase de homologação e produção e obter `DATABASE_URL`/`DIRECT_URL`.
3. Criar os serviços de homologação e validar API, CORS, banco, Redis e S3.
4. Configurar o projeto web de homologação no Vercel.
5. Criar os ambientes `staging` e `production` no GitHub para isolar secrets; em `production`, ativar **required reviewers** (aprovação).
6. Configurar a proteção das branches `development` e `main` exigindo os seis checks do CI.
7. Cadastrar em cada ambiente `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RENDER_DEPLOY_HOOK_URL`, `API_HEALTH_URL`, `DATABASE_URL` e `DIRECT_URL`.
8. Promover o workflow de CD para `main` e validar o primeiro deploy de `development`.
9. Repetir a configuração para produção, com aprovação e estratégia de rollback.
10. Adicionar EAS Build/Submit quando a equipe definir contas e publicação Android/iOS.

## Rollback

- **Vercel:** promover novamente um deployment anterior validado.
- **Render:** fazer rollback para um deploy anterior ou redeploy de um commit conhecido.
- **Banco:** migrations exigem processo próprio, backup e aprovação humana; o CD não reverte schema automaticamente.

## Referências operacionais

- [Deploys e integração com checks no Render](https://render.com/docs/deploys)
- [Deploy hooks do Render](https://render.com/docs/deploy-hooks)
- [Vercel com GitHub Actions](https://vercel.com/docs/git/vercel-for-github)
- [Ambientes e proteção de deploy no GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- [Exportação web estática com Expo Router](https://docs.expo.dev/router/web/static-rendering/)
