# Guia de contribuição

Este documento descreve o fluxo de desenvolvimento, revisão e promoção de código adotado pela equipe do monorepo **Kapa Protetores**.

Para regras de arquitetura, segurança e qualidade de código, consulte também [`AGENTS.md`](AGENTS.md).

## Estrutura de branches

O repositório utiliza duas branches permanentes:

| Branch | Objetivo |
|--------|----------|
| `main` | Entrega e apresentação — versão estável do projeto |
| `development` | Integração — recebe as features aprovadas antes de ir para `main` |

> Não há branch de homologação (`hml`): o projeto não possui dois ambientes de deploy. A validação acontece na própria `development`.

## Estratégia de merge

Cada etapa do fluxo usa um tipo de merge específico no GitHub:

| Origem | Destino | Tipo de merge |
|--------|---------|---------------|
| Branch de desenvolvimento (`feat/#12`, `fix/#13`, etc.) | `development` | **Squash and merge** |
| `development` | `main` | **Merge commit** |

- **Squash and merge:** consolida os commits da branch em um único commit em `development`, mantendo o histórico de integração limpo.
- **Merge commit:** preserva o histórico completo ao promover para `main`, e só acontece em marcos (entrega, apresentação, release).

## Criação de branches

Toda nova implementação deve ser criada a partir da branch `development`.

### Padrão de nomenclatura

Use o prefixo semântico que descreve o tipo da alteração, seguido do número da issue:

```text
{prefixo}/#{numero-da-issue}
```

Prefixos comuns:

| Prefixo | Uso |
|---------|-----|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `chore` | Manutenção, refatoração, dependências, CI |
| `docs` | Documentação |
| `refactor` | Refatoração sem mudança de comportamento |

Exemplos:

```text
feat/#12
fix/#13
chore/#14
```

## Pré-requisitos locais

Antes de desenvolver, configure o ambiente conforme o [`README.md`](README.md):

- **Node.js** 20 LTS ou superior
- **npm** 10 ou superior
- **Docker** (opcional, para Postgres + Redis locais via `apps/server/docker-compose.yaml`)
- Para testar no celular: **Expo Go** ou emulador configurado

```bash
npm install
```

## Fluxo de desenvolvimento

### 1. Atualizar a branch de integração

```bash
git checkout development
git pull origin development
```

### 2. Criar a branch da demanda

Crie a branch a partir de `development`, seguindo o padrão de nomenclatura (ex.: `feat/#12`):

```bash
git checkout -b feat/#12
```

### 3. Desenvolver a funcionalidade

Realize os commits seguindo os padrões abaixo.

#### Commits

O histórico do repositório segue [Conventional Commits](https://www.conventionalcommits.org/). Em um monorepo, **use o escopo para indicar qual app ou pacote foi alterado**:

| Escopo | Caminho |
|--------|---------|
| `mobile-web` | `apps/mobile-web` |
| `server` | `apps/server` |
| `shared` | `packages/shared` |
| `eslint-config` | `packages/eslint-config` |

Formato:

```text
{tipo}({escopo}): {descrição}
```

Exemplos:

```text
feat(mobile-web): adiciona tela de cadastro de animal
fix(server): corrige validação do payload de animal
chore(shared): adiciona utilitário de formatação de data
refactor(mobile-web): extrai botão primário para componente
```

Omita o escopo apenas quando a alteração for transversal ao monorepo (raiz, CI, documentação geral):

```text
chore: configura scripts do monorepo
docs: atualiza guia de contribuição
```

#### Qualidade

Antes de abrir o Pull Request, execute localmente:

```bash
npm run lint   # ESLint em todos os workspaces
```

Comandos por workspace, quando útil:

```bash
npm run lint --workspace=apps/server
npm run lint --workspace=apps/mobile-web
npm run lint --workspace=packages/shared
```

> **Testes automatizados e pipeline de CI ainda não estão configurados.** A equipe vai definir as ferramentas e os checks obrigatórios; quando isso acontecer, esta seção e a seção [Checks automáticos](#checks-automáticos) serão atualizadas.

### 4. Publicar os commits

A branch já existe no remoto (criada no passo 2) ou pode ser publicada agora:

```bash
git push -u origin feat/#12
```

### 5. Abrir Pull Request para integração

```text
feat/#12 -> development  (Squash and merge)
```

Na descrição do PR, referencie a issue correspondente com uma palavra-chave de fechamento automático (ex.: `Closes #12`). Ao concluir o merge, a issue será fechada automaticamente pelo GitHub.

Exemplo de descrição:

```text
Closes #12

Implementa o cadastro de animais conforme especificado na issue.

## Test plan
- [ ] npm run lint
- [ ] Validação manual no app (quando aplicável)
```

## Relação com issues

Toda branch de desenvolvimento está vinculada a uma issue — o número aparece no nome da branch (ex.: `feat/#12` corresponde à issue `#12`).

Todo Pull Request deve:

- Referenciar explicitamente a issue na descrição.
- Incluir uma palavra-chave de fechamento automático para que a issue seja encerrada quando o merge ocorrer.

Palavras-chave aceitas pelo GitHub:

| Palavra-chave | Exemplo |
|---------------|---------|
| `Closes` | `Closes #12` |
| `Fixes` | `Fixes #12` |
| `Resolves` | `Resolves #12` |

Isso se aplica a PRs de desenvolvimento (`feat/#12` → `development`) e de hotfix (`hotfix/#99` → `main` ou `development`). A issue referenciada deve ser a mesma indicada no nome da branch.

## Processo de code review

Pull Requests de desenvolvimento (`feat/#12`, `fix/#13`, etc.) para `development` devem ser revisados por um desenvolvedor diferente do autor.

A promoção `development` → `main` **não exige** revisão de outro desenvolvedor — o merge é controlado exclusivamente pelo mantenedor do repositório (ver [Promoção para main](#promoção-para-main)).

### Regras obrigatórias (PRs para `development`)

- O autor não pode aprovar seu próprio Pull Request.
- É necessária pelo menos uma aprovação de outro desenvolvedor.
- Não pode haver conflitos de merge.
- Todas as discussões e comentários devem estar resolvidos.
- O merge em `development` deve ser feito com **Squash and merge**.
- A descrição do PR deve referenciar a issue vinculada à branch e incluir palavra-chave de fechamento (`Closes`, `Fixes` ou `Resolves`).
- Quando houver checks automáticos configurados, todos devem estar aprovados.

### Checks automáticos

Ainda não há pipeline de CI configurado no repositório. Quando a equipe definir as verificações obrigatórias (lint, testes, análise estática), elas serão documentadas nesta seção.

### Fluxo de revisão

```text
Desenvolvedor A
    │
    └──► feat/#12
             │
             ▼
      PR para development
             │
             ▼
Desenvolvedor B realiza review
             │
     ┌───────┴────────┐
     │                │
Solicita ajustes   Aprova
     │                │
     ▼                ▼
 Novo commit      Squash and merge em development
```

## Homologação (integração)

A branch `development` concentra todas as alterações aprovadas para validação.

```text
feat/#12 ─┐  (Squash and merge)
fix/#13 ──┼──► development
chore/#14 ┘
```

Nesta etapa podem ocorrer:

- Testes funcionais no app (mobile/web) e na API
- Testes de integração
- Testes de regressão
- Validação de regras de negócio
- Aprovação dos responsáveis pela entrega

## Promoção para main

Após a validação, o mantenedor do repositório abre uma Pull Request da branch `development` para a branch `main` e realiza o merge quando estiver satisfeito. Isso deve acontecer em **marcos** (entrega, apresentação, release), não a cada merge.

```text
development -> main  (Merge commit)
```

Esta etapa é controlada exclusivamente pelo mantenedor — **não há revisão nem aprovação de outro desenvolvedor**.

### Requisitos

- Ausência de conflitos de merge.
- O merge em `main` deve ser feito com **Merge commit**.

Fluxo:

```text
feat/#12
    ↓
development
    ↓
main
    ↓
Apresentação / Entrega
```

## Fluxo completo

```text
main
  ▲
  │ PR development -> main (Merge commit, em marcos)
  │
development
  ▲
  │ PR feat/#12 -> development (Squash and merge)
  │
feat/#12
```

## Proteções recomendadas

### Branch `main`

- Push direto proibido.
- Merge apenas via Pull Request (`development` → `main`).
- Promoção controlada pelo mantenedor (sem exigência de segundo revisor).
- Permitir apenas **Merge commit** em Pull Requests.

### Branch `development`

- Push direto proibido.
- Merge apenas via Pull Request.
- Aprovação obrigatória.
- Permitir apenas **Squash and merge** em Pull Requests.

## Correções emergenciais (hotfix)

Quando uma correção precisar ser aplicada diretamente em produção (`main`):

### Criar branch a partir da main

```text
hotfix/#99
```

### Fluxo

```text
main
  │
  └──► hotfix/#99
```

Após a correção:

```text
hotfix/#99 -> main          (Merge commit)
hotfix/#99 -> development   (Squash and merge)
```

Em ambos os PRs de hotfix, referencie e feche a issue na descrição (ex.: `Closes #99`).

Dessa forma, a correção aplicada em produção também é incorporada à `development`, evitando que seja sobrescrita em futuras promoções.

## Estrutura do monorepo

Alterações devem respeitar os limites de cada pacote:

| Caminho | Responsabilidade |
|---------|------------------|
| `apps/mobile-web` | App universal Expo (Android, iOS e Web/PWA) |
| `apps/server` | API REST (Node.js + Express + TypeScript) |
| `packages/shared` | Tipos, constantes e utilitários compartilhados |
| `packages/eslint-config` | Configuração de lint compartilhada |

Tipos e contratos de domínio devem ser centralizados em `@kapa/shared` quando compartilhados entre app e API. Novas dependências exigem avaliação de segurança e compatibilidade com a versão do Expo SDK (ver [`AGENTS.md`](AGENTS.md)).

## Resumo do processo

### Desenvolvimento

1. Atualizar `development` (`git checkout development && git pull`).
2. Criar a branch `{prefixo}/#{numero-da-issue}` a partir de `development`.
3. Implementar, commitar e publicar com `git push`.
4. Garantir `npm run lint` verde localmente.
5. Abrir PR para `development` com referência à issue (`Closes #12`), obter aprovação de outro desenvolvedor (sem conflitos) e fazer **Squash and merge** (a issue é fechada automaticamente).

### Integração

6. Validar as alterações em `development` (testes, regras de negócio e aprovação da entrega).

### Entrega

7. O mantenedor abre PR de `development` para `main` e faz **Merge commit** em marcos, após a validação.
