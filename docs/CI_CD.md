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
| `CI / Segurança (Semgrep + Trivy + npm audit)` | Auditoria npm, Semgrep, Trivy e Gitleaks |

As ferramentas de segurança continuam executando mesmo quando uma etapa anterior encontra um problema, permitindo consultar todos os resultados da execução.

### Cobertura no Pull Request

Em PRs criados dentro do próprio repositório, o workflow publica um comentário novo a cada push com:

- commit analisado;
- link para a execução do GitHub Actions;
- cobertura de statements, branches, functions e lines;
- resultados agrupados em `mobile-web`, `server`, `shared` e total.

O relatório completo `coverage/lcov.info` permanece disponível como artefato por sete dias. PRs de forks executam a cobertura, mas não recebem permissão para publicar comentários.

### Proteção das branches

Configure regras para `development` e `main` exigindo os cinco checks listados acima. Para `development`, mantenha também aprovação de outro desenvolvedor, discussões resolvidas e Squash and merge, conforme o [`CONTRIBUTING.md`](../CONTRIBUTING.md).

### Dependabot

O arquivo [`.github/dependabot.yml`](../.github/dependabot.yml) procura atualizações npm e GitHub Actions semanalmente. Existe uma espera de sete dias depois da publicação de uma versão para reduzir o risco de adotar imediatamente uma versão comprometida ou instável.

## Entrega contínua planejada

```mermaid
flowchart LR
    PR[Pull Request] --> CI[Cinco checks de CI]
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
3. gera o build com Vercel CLI fixado na versão `62.5.0`;
4. publica o web no Vercel;
5. aciona o deploy do mesmo commit da API pelo deploy hook do Render.

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

### Bloqueios antes de ativar o CD

1. Corrigir as vulnerabilidades existentes no `package-lock.json`; o check `Segurança` bloqueia o deploy enquanto estiver vermelho.
2. Criar os projetos de homologação e produção no Vercel e no Render.
3. Definir PostgreSQL/Supabase, Redis e armazenamento S3 separados por ambiente.
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

Variáveis `SEED_ADMIN_*` não devem permanecer no runtime de produção depois do uso controlado. O workflow de deploy não executará migrations nem seed automaticamente.

### Variáveis públicas do web

- `EXPO_PUBLIC_API_URL`, sempre HTTPS e terminando na API correta;
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`;
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`;
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.

Variáveis com prefixo `EXPO_PUBLIC_` são incorporadas ao bundle e não podem conter segredos.

## Sequência de implementação do CD

1. Resolver a dívida de dependências até o check `Segurança` passar.
2. Criar os serviços de homologação e validar API, CORS, banco, Redis e S3.
3. Configurar o projeto web de homologação no Vercel.
4. Criar os ambientes `staging` e `production` no GitHub para isolar secrets; em `production`, exigir aprovação quando o plano do repositório oferecer esse recurso.
5. Cadastrar em cada ambiente `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` e `RENDER_DEPLOY_HOOK_URL`.
6. Promover o workflow de CD para `main` e validar o primeiro deploy de `development`.
7. Repetir a configuração para produção, com aprovação e estratégia de rollback.
8. Adicionar EAS Build/Submit quando a equipe definir contas e publicação Android/iOS.

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
