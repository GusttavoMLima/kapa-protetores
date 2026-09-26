# Integração e Guia de Desenvolvimento — Kapa Protetores

Este documento consolida a arquitetura de autenticação (**Google OAuth** e **E-mail/Senha**), persistência de sessão, integração entre React Native/Expo e a API Express, infraestrutura local com Docker e procedimentos para resolução de problemas e garantia de qualidade.

## Gestão dos animais do abrigo

### Interface e permissões

- Entrada na home: **Animais do abrigo → Gerenciar animais**, para `admin`, `protector` e `volunteer`.
- `/gestao/animais`: listagem interna com busca por nome/raça, espécie, status, ordenação e paginação de 12 registros. Os contadores representam todo o abrigo, independentemente dos filtros.
- `/gestao/animais/[id]`: edição de identificação, porte, acompanhamento, saúde, temperamento, local e observações. Validação no cliente e na API; falhas ao salvar preservam o formulário. Retornar à lista mantém os filtros enquanto a tela permanece na pilha e recarrega os dados.
- `/cadastro-animal`: formulário existente, agora protegido pelos mesmos perfis e com retorno à listagem.
- `/adopet` permanece reservado ao catálogo de adoção. Adotantes não recebem ações de gestão.
- Estilo em Tailwind/NativeWind, com os tokens existentes, fontes do projeto, limite de 1140px do `DESIGN.md`, linhas no desktop e cartões no celular. Seletores possuem estados acessíveis, alvos mínimos de 48px e os status incluem texto.

### Contrato da API

| Método / caminho | Uso |
| --- | --- |
| `GET /api/animals/management` | Listagem interna paginada, todos os status |
| `GET /api/animals/management/:id` | Cadastro completo, incluindo fotos |
| `PATCH /api/animals/management/:id` | Atualiza apenas os campos enviados; campos desconhecidos e corpo vazio são rejeitados |
| `POST /api/animals` | Cadastro existente, restrito à equipe |
| `POST /api/animals/:id/photos` | Upload existente, restrito à equipe |
| `GET /api/animals` | Consulta pública: apenas `available` |
| `GET /api/animals/:id` | Consulta pública: retorna 404 se o animal não estiver disponível |

A listagem interna aceita `page` (padrão 1), `pageSize` (padrão 12, máximo 50), `search` (até 120 caracteres), `species` (`dog/cat/other`), `status` (`rescued/treating/available/adopted`) e `sort` (`recent/name`). Retorna `{ success: true, data: { items, total, page, pageSize, counts } }`. `counts` contém as quatro contagens globais. A pesquisa e paginação são executadas no PostgreSQL; a listagem inclui a foto mais recente de cada animal.

As rotas de gestão, criação e upload validam o JWT e consultam o **papel atual do usuário no banco**, para que remoção de conta ou revogação de papel não dependam da expiração do token. `adopter` recebe 403; sessão ausente, inválida, expirada ou conta removida recebe 401. IDs e entradas são validados. O cadastro público `POST /api/auth/register` aceita somente `adopter`: equipe é atribuída pela administração, evitando autoatribuição de acesso. O fluxo público `/api/users/create` já força `adopter`.

**Integração com o catálogo do colega:** respostas públicas usam uma projeção própria com identificação, características de adoção, status e fotos. Não retornam `place`, `observations`, `rescuedAt`, `healthCondition` nem `createdAt`. Para informações internas, usar os endpoints de gestão autenticados. A tela de interesses/adoção não foi implementada nesta entrega.

### Persistência e limites

Não houve mudança no schema, migrations ou índices. São usadas `tb_animals`, `tb_animal_photos` e a coluna `role` de `tb_users`. O modelo atual representa um único abrigo; não possui vínculo por ONG ou responsável para limitar registros por instituição.

O editor envia PATCH apenas dos campos exibidos, preservando `ageStage`, escores de comportamento, compatibilidades, data de resgate e fotos. A foto existente é apresentada; troca de foto e histórico veterinário não fazem parte deste editor. Os campos extras do cadastro legado (pelagem e histórico individual de doses, por exemplo) não têm colunas próprias: esta entrega não cria persistência para eles nem altera silenciosamente o schema.

### Verificações da funcionalidade

- `npm run type-check` e `npm run lint`.
- `npm test`: testes da API mais testes do modelo de edição; cobre perfis, revogação, token inválido/expirado, filtros, paginação, PATCH parcial, campos privados e autoelevação no cadastro público.
- Teste de navegador: iniciar Expo em `localhost:8081` e executar `node apps/mobile-web/tests/animal-management-browser.cjs` com Playwright disponível (ou `PLAYWRIGHT_MODULE_PATH` apontando para uma instalação existente) e Microsoft Edge instalado. `ANIMAL_UI_URL` permite outro endereço. O teste intercepta a API com fixtures isoladas, não altera o banco e grava capturas em `apps/mobile-web/.expo/animal-management-qa/` (ignorado pelo Git). Verifica desktop/celular, busca, filtros, paginação, edição, validação, erros, estado vazio e bloqueio de adotantes.

---

## 1. Arquitetura de Autenticação e Sessão

A autenticação é centralizada e compartilhada entre a aplicação mobile/web (`apps/mobile-web`) e a API REST (`apps/server`).

### 1.1 Autenticação Social com Google OAuth

* **Fluxo no Cliente (`apps/mobile-web`)**:
  * Implementado em [`LoginForm`](apps/mobile-web/src/components/forms/login/index.tsx) através do hook `Google.useIdTokenAuthRequest(...)` da biblioteca `expo-auth-session/providers/google`.
  * Configurado com `WebBrowser.maybeCompleteAuthSession()` para captura e fechamento seguro do popup de autenticação em ambiente web e mobile.
  * Extração resiliente de token: prioriza o `id_token` JWT retornado pelo Google, mantendo fallback para `response.authentication?.idToken` e `response.params?.access_token`.
  * Conforme as regras do React Compiler / React 19, erros da sessão de autenticação são derivados durante a renderização (`googleAuthError`), evitando atualizações de estado síncronas em efeitos.

* **Fluxo no Backend (`apps/server`)**:
  * Rota dedicada: `POST /api/auth/google`.
  * Validação do corpo da requisição via Zod (`googleAuthSchema`).
  * Método [`UserService.authenticateWithGoogle`](apps/server/src/services/UserService.ts) com suporte dual de verificação:
    1. **Google ID Token (JWT)**: Validação criptográfica com as chaves públicas oficiais do Google via `googleClient.verifyIdToken(...)`.
    2. **Google OAuth2 Access Token (`ya29...`)**: Validação de segurança via `googleClient.getTokenInfo(...)` e requisição ao endpoint OIDC `https://www.googleapis.com/oauth2/v3/userinfo`.
  * Validação estrita de audiência (`audience`) contra os Client IDs configurados no projeto (`GOOGLE_CLIENT_ID`, `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`).
  * Verificação obrigatória de email confirmado (`email_verified === true`).
  * **Find or Create**: Localiza o usuário cadastrado pelo email; caso não exista, cria automaticamente a conta com papel `adopter` e permissões padrão (`DEFAULT_USER_ADOPTER_RULES`).
  * **Sincronização de Avatar**: Caso o usuário já exista e sua foto de perfil do Google seja atualizada ou divirja do banco, o avatar é atualizado automaticamente durante o login.
  * Emissão de JWT próprio da aplicação via [`Jwt.generateToken`](apps/server/src/utils/Jwt.ts) contendo `sub`, `email`, `role`, `rules` e `username`.

---

### 1.2 Autenticação Local (E-mail e Senha)

* **Rotas da API**:
  * `POST /api/users/signin` (ou `POST /api/users/login`): Login com credenciais.
  * `POST /api/users/register`: Cadastro de novos adotantes.

* **Validação de Entrada (`apps/server/src/schemas/user.schema.ts`)**:
  * **`signInSchema`**:
    * `email`: Sanitizado com `.trim()`, `.toLowerCase()` e validado com formato de e-mail.
    * `password`: Obrigatório (`min(1)`), preservando caracteres e espaços intencionais.
  * **`registerSchema`**:
    * `username`: `.trim()`, mínimo de 3 e máximo de 50 caracteres (compatível com a entidade de domínio `User`).
    * `email`: Sanitizado em minúsculas e validado.
    * `password`: Mínimo de 6 e máximo de 128 caracteres (previne DoS por sobrecarga de hashing em requisições abusivas).
    * `avatar`: Opcional (`.nullish()`), aceitando URLs válidas ou string vazia `""` (que é convertida automaticamente para `null`).
    * `latitude` e `longitude`: Opcionais (`.nullish()`), restritos aos limites geográficos válidos (`[-90, 90]` e `[-180, 180]`).

* **Regras de Negócio e Segurança ([`UserController.ts`](apps/server/src/controllers/UserController.ts))**:
  * **Anti-Enumeração de Usuários**: Respostas de erro padronizadas com status `401 Unauthorized` e mensagem genérica (*"E-mail ou senha incorretos"*) para usuários inexistentes ou senhas erradas.
  * **Detecção de Contas Google**: Se uma conta foi criada via Google OAuth e não possui senha cadastrada, o login local instrui o usuário a autenticar via Google (`400 Bad Request`).
  * **Cadastro Único**: Conflito de e-mail duplicado retorna `409 Conflict` imediatamente.
  * **Segurança no Hash**: O controlador delega a senha pura ao `UserService.create`, que aplica o hash com salt (`Encrypt.saltHash`), prevenindo problemas de duplo hashing.

---

### 1.3 Persistência de Sessão e Estado Global ([`authProvider.tsx`](apps/mobile-web/src/contexts/authProvider.tsx))

A sessão é gerenciada pelo `AuthProvider` e mantida no armazenamento do dispositivo (`genericStorage` sobre `AsyncStorage`):

* **Chaves de Armazenamento**:
  * `@kapa:auth-token`: Token JWT da sessão.
  * `@kapa:user-data`: Objeto DTO do usuário autenticado (`User`).

* **Ciclo de Vida**:
  1. **Inicialização (`loadStorageState`)**: Ao abrir ou recarregar a aplicação, recupera o token e o perfil do usuário. Se válidos, injeta automaticamente o cabeçalho padrão `Authorization: Bearer <token>` na instância do `kapaService` (Axios) e define `isLogged = true`.
  2. **Login com Sucesso**: Tanto `signIn(email, password)` quanto `handleGoogleLogin(idToken)` salvam a sessão, atualizam o estado e redirecionam o usuário para a área protegida `/(protected)/(tabs)`.
  3. **Logout (`signOut`)**: Limpa os estados em memória, apaga o cabeçalho `Authorization` do Axios, remove as chaves do `AsyncStorage` e redireciona para `/signIn`.
  4. **Feedback de Erro Visual**: O formulário exibe um banner de alerta baseado no Material Design (`#FFDAD6` com texto `#93000A`) caso as credenciais estejam erradas ou ocorra erro de rede.

---

### 1.4 Módulo Completo de Gestão de Usuários (`/api/users`)

O módulo de usuários conta com um conjunto completo de endpoints RESTful, com autorização granular via middleware [`rulesHandler`](apps/server/src/middlewares/rulesHandler.ts) e proteção estrita contra **IDOR/BOLA**:

| Método | Endpoint | Proteção / Regra | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/count` | Público | Quantidade total de usuários cadastrados |
| `GET` | `/api/users/all` | `authTokenHandler` + `admin:*` | Listagem geral de usuários (suporta filtro `?role=adopter`) |
| `POST` | `/api/users/create` | Público | Cadastro / registro de novos usuários |
| `POST` | `/api/users/signin` | Público | Autenticação local (e-mail e senha) |
| `GET` | `/api/users/me` | `authTokenHandler` + `user:read:own` | Dados do usuário logado agregados com contadores (`_count`) |
| `PATCH` | `/api/users/me` | `authTokenHandler` + `user:update:own` | Atualização do próprio perfil (`username`, `avatar`, localização) |
| `PATCH` | `/api/users/me/password` | `authTokenHandler` + `user:update:own` | Alteração da própria senha com confirmação da senha atual |
| `DELETE` | `/api/users/me` | `authTokenHandler` + `user:delete:own` | Autoexclusão da conta pelo próprio usuário |
| `GET` | `/api/users/:id` | `authTokenHandler` + `user:read:other` | Consulta de perfil público por ID de usuário |
| `PATCH` | `/api/users/:id/role` | `authTokenHandler` + `admin:*` | Alteração administrativa de papel (`role`) do usuário |
| `DELETE` | `/api/users/:id` | `authTokenHandler` + `admin:*` | Exclusão administrativa de usuário por ID |

* **Validação de Entrada (`user.schema.ts`)**:
  * **`updateProfileSchema`**: Validação de `username` (3-50 caracteres), `avatar` (URL válida ou string vazia convertida para `null`) e limites de geolocalização (`latitude` `[-90, 90]` e `longitude` `[-180, 180]`).
  * **`updateUserPasswordSchema`**: Validação de `currentPassword` obrigatória e `newPassword` entre 6 e 128 caracteres.
  * **`updateRoleSchema`**: Restrição estrita aos enums válidos (`adopter`, `protector`, `admin`, `volunteer`).
  * **`userIdParams`**: Validação de identificador do usuário em parâmetros de rota.

* **Regras de Segurança na Troca de Senha (`UserService.updatePassword`)**:
  * Contas criadas via Google OAuth (sem senha definida) são impedidas de trocar senha via endpoint local (`400 Bad Request`).
  * A senha atual informada é conferida criptograficamente via [`Encrypt.verifySaltHash`](apps/server/src/utils/Encypt.ts) contra o hash salvo no banco (`401 Unauthorized` se incorreta).
  * A nova senha não pode ser idêntica à senha atual (`400 Bad Request`).
  * A resposta da API omite qualquer dado sensível, retornando apenas confirmação de sucesso.

---

## 2. Correções Críticas Realizadas no Projeto

1. **Persistência de Sessão Multiplataforma**:
   * **Causa**: Uso de mocks estáticos e ausência de métodos de remoção de chaves.
   * **Solução**: Implementação do método `genericStorage.remove(key)` e estruturação de restauração de token e dados do usuário com sincronização de cabeçalhos no Axios.

2. **Mapeamento de Coordenadas Nulas (`UserRepository.ts`)**:
   * **Causa**: No método `mapToDomain`, os campos eram convertidos via `Number(record.latitude)`. Em JavaScript, `Number(null) === 0`, transformando coordenadas nulas de usuários recém-cadastrados em `0, 0` (Null Island no Oceano Atlântico).
   * **Solução**: Ajustado para `record.latitude != null ? Number(record.latitude) : null`, preservando o valor nulo original no banco e no DTO da API.

3. **Casing Case-Sensitive em URLs de Avatar (`Url.ts`)**:
   * **Causa**: `Url.create` executava `.toLowerCase()` em toda a URL, quebrando os tokens e hashes Base64 das fotos de perfil do Google e gerando erro 404.
   * **Solução**: Removido o `.toLowerCase()`. O construtor `new URL(trimmed)` cuida de normalizar apenas o protocolo e host, mantendo os parâmetros e caminhos intactos.

4. **Hoisting de Módulos ES e Erro SCRAM do PostgreSQL**:
   * **Causa**: Importações estáticas de rotas instanciavam `PrismaService` antes da execução de `dotenv.config()`, fazendo com que o pool do `pg` tentasse autenticar sem senha.
   * **Solução**: Criação de `apps/server/src/config/env.ts` e exportação do Prisma via `Proxy` preguiçoso (*lazy initialization*).

5. **Proteção de Salt e Execução Autônoma de Testes (`Encypt.ts`)**:
   * **Causa**: `SALT_SECRET` dependia de execução atrelada ao servidor Express e quebrava ao rodar testes isolados via `tsx --test`.
   * **Solução**: Importação do módulo de ambiente e função dinâmica `getSaltSecret()` com fallback seguro em desenvolvimento e obrigatoriedade em produção.

6. **Limpeza de Permissões Desnecessárias no Android (`app.json`)**:
   * **Causa**: A permissão `android.permission.RECORD_AUDIO` foi incluída indevidamente na configuração do Expo.
   * **Solução**: Removida do manifesto Android para evitar alertas invasivos ao usuário e rejeição na Google Play Store.

7. **Proteção contra Vazamento de Hash de Senha em Dados do Usuário (`UserRepository.ts`)**:
   * **Causa**: No método `findByIdCountingRelations`, a consulta Prisma retornava o registro completo do usuário incluindo a coluna `password`. Ao repassar o objeto até a resposta da API (`GET /users/me`), o hash da senha era exposto ao cliente.
   * **Solução**: Aplicação de `select` explícito no Prisma omitindo o campo `password`, com mapeamento para o tipo seguro `UserWithRelationsCount` exportado em `@kapa/shared`.

8. **Tratamento de Exceções e Associação de Handlers em Rotas (`UserRouter.ts` e `UserController.ts`)**:
   * **Causa**: O uso de `catch { next() }` sem argumentos engolia exceções da aplicação, impedindo o [`ErrorHandler`](apps/server/src/middlewares/ErrorHandler.ts) de responder adequadamente. Além disso, a rota `GET /users/:id` chamava incorretamente `userInfo` (ignorando o parâmetro `:id`), e `getAll` não aguardava a Promise do banco com `await`.
   * **Solução**: Padronização com `catch (err) { next(err) }`, associação de `/:id` com `this.controller.getById`, adição de `await` e proteção da listagem geral `/all` com `rulesHandler('admin:*')`.

9. **Remoção de Avatar e Dados Nulos no Perfil (`UserRepository.ts`)**:
   * **Causa**: Na atualização do usuário, `avatar: user.getAvatar()?.toString() ?? undefined` impedia que um usuário removesse sua foto de perfil (`null`), pois campos `undefined` são ignorados no `update` do Prisma.
   * **Solução**: Diferenciação explícita entre valor não informado (`undefined`) e intenção de limpeza (`null`).

---

## 3. Infraestrutura Docker Local

Os serviços de banco, cache e armazenamento de arquivos são executados via Docker Compose:

| Serviço | Container | Porta | Função |
| --- | --- | --- | --- |
| PostgreSQL | `kapa-database` | `5432` | Banco de dados relacional principal |
| Redis | `kapa-redis` | `6379` | Cache e gerenciamento de sessões |
| MinIO API | `kapa-storage` | `9000` | API compatível com S3 para upload de arquivos |
| MinIO Console | `kapa-storage` | `9001` | Painel web administrativo do MinIO |
| Inicializador | `storage-init` | — | Provisiona o bucket local `kapa-public` e finaliza com status `0` |

### Credenciais Locais de Desenvolvimento

* **PostgreSQL**: Usuário `docker`, Senha `docker`, Banco `kapa`
* **Redis**: Senha `kapa`
* **MinIO**: Usuário `kapa`, Senha `kapa-local-storage-secret`

---

## 4. Guia de Configuração e Execução

### 4.1 Pré-requisitos
* Node.js 20+ (recomendado Node 22+)
* npm 10+ *(evitar pnpm no monorepo para prevenir conflitos de versões do React)*
* Docker e Docker Compose

### 4.2 Passo a Passo de Inicialização

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente**:
   * Servidor:
     ```bash
     cp apps/server/.env.example apps/server/.env
     ```
   * Mobile/Web:
     ```bash
     cp apps/mobile-web/.env.example apps/mobile-web/.env
     ```

3. **Subir os containers de banco e storage**:
   ```bash
   docker compose -f apps/server/docker-compose.yaml up -d
   ```

4. **Aplicar migrações do PostgreSQL**:
   ```bash
   npx prisma migrate deploy --schema=apps/server/prisma/schema.prisma
   ```

5. **Iniciar a aplicação completa (Web + Servidor)**:
   ```bash
   npm run dev
   ```
   *O comando raiz executa o Expo Web e o servidor Express simultaneamente com hot-reloading.*

---

## 5. Variáveis de Ambiente

| Variável | Escopo | Descrição |
| --- | --- | --- |
| `PORT` | Backend | Porta HTTP do servidor Express (padrão: `4000`) |
| `DATABASE_URL` | Backend | String de conexão com o PostgreSQL |
| `JWT_SECRET` | Backend | Chave secreta para assinatura dos tokens JWT |
| `SALT_SECRET` | Backend | Segredo utilizado na derivação PBKDF2 de senhas |
| `CLIENT_URL` | Backend | Lista exata de origens web autorizadas pelo CORS, separadas por vírgula (desenvolvimento: portas 8081 e 8082) |
| `GOOGLE_CLIENT_ID` | Backend | Client ID principal da aplicação Google |
| `GOOGLE_WEB_CLIENT_ID` | Backend | Client ID web para verificação de audiência |
| `GOOGLE_IOS_CLIENT_ID` | Backend | Client ID iOS para verificação de audiência |
| `GOOGLE_ANDROID_CLIENT_ID` | Backend | Client ID Android para verificação de audiência |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Mobile/Web | Client ID Google injetado no navegador pelo Expo |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Mobile/Web | Client ID nativo para dispositivos iOS |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Mobile/Web | Client ID nativo para dispositivos Android |

Se o Client ID correspondente à plataforma estiver vazio, a aplicação continua
disponível para autenticação por e-mail e senha e mantém o botão Google
desabilitado. O hook usa um identificador interno apenas para satisfazer a
inicialização do `expo-auth-session`; ele nunca inicia o OAuth enquanto a
variável pública real não estiver configurada. Depois de alterar uma variável
`EXPO_PUBLIC_*`, reinicie o Metro para que o valor seja incorporado ao bundle.

O Expo SDK 57 resolve workspaces do monorepo automaticamente. O
`metro.config.js` não define `watchFolders` nem `resolver.nodeModulesPaths`;
isso evita a varredura manual de todo o repositório e o erro `EMFILE: too many
open files` no Windows. Após alterar essa configuração, execute o Expo uma vez
com `npm run web --workspace=apps/mobile-web -- --clear` para remover o cache
antigo. O script `web` limita o Metro a um worker para reduzir o número de
arquivos abertos simultaneamente no Windows.

O destino web usa `output: "single"` (SPA). As telas dependem da sessão
persistida no navegador e não usam carregadores ou API Routes do Expo; nesse
modo o desenvolvimento gera somente o bundle do cliente, evitando a segunda
compilação usada pela renderização estática e reduzindo o consumo de arquivos
no Windows. A API Express continua sendo executada separadamente na porta
4000.

O Tailwind usa `darkMode: "class"`. Além de deixar a troca de tema explícita,
isso evita que o `react-native-css-interop` tente alterar manualmente um tema
configurado como `media` quando o CSS é injetado pelo Metro no navegador.
| `EXPO_PUBLIC_API_URL` | Mobile/Web | URL base da API (padrão: `http://localhost:4000/api`) |

---

## 6. Validação de Qualidade, Husky e Testes

O projeto conta com verificações automatizadas de qualidade através do **Husky** (`.husky/pre-commit`), executando linting, checagem de tipos e testes antes de cada commit:

```bash
# 1. Executar os hooks do pre-commit manualmente
./.husky/pre-commit

# 2. Bateria completa de testes automatizados do backend (60 testes em 17 suítes)
npm test

# 3. Verificação de tipos TypeScript em todos os workspaces
npm run type-check

# 4. Verificação de Linting em todos os pacotes
npm run lint

# 5. Build de produção do servidor
npm run build:server

# 6. Build de exportação web do Expo
npm run build:web
```

### 6.1 Estrutura das Suítes de Teste
* **`apps/server/src/tests/auth.test.ts`**: Validação de schemas de autenticação Google, geração/verificação criptográfica de tokens JWT, middlewares de proteção de rota e controlador de login/registro.
* **`apps/server/src/tests/user.test.ts`**: Suíte dedicada ao ciclo de vida do usuário:
  * Entidade de domínio `User` (regras de negócio, setters, validação de regras de papel e DTOs seguros).
  * Schemas Zod (`updateProfileSchema`, `updateRoleSchema`, `updateUserPasswordSchema`, `userIdParams`).
  * Casos de uso do `UserService` (atualização de perfil, troca de papel, exclusão e contadores de relações).
  * `UserController` e integridade das 11 rotas mapeadas no `UserRouter`.

### 6.2 Testes de Carga e Performance com Grafana k6 (Docker)

O backend possui suporte a testes de carga e estresse utilizando o **Grafana k6** encapsulado em Docker (imagem oficial `grafana/k6`), sem dependências extras:

* **Configuração no Docker Compose (`apps/server/docker-compose.yaml`)**:
  * Serviço `k6` sob o perfil `test` (não inicializa automaticamente com `docker compose up -d`).
  * Configurado com `network_mode: host` para comunicação direta de baixa latência com a API local (`http://localhost:4000`).
  * Volume montado em `./k6:/scripts`.

* **Scripts Disponíveis (`apps/server/k6/`)**:
  * `smoke-test.js`: Validação rápida (1 VU por 10s) dos endpoints `/health`, `/health/redis` e `/users/count`.
  * `load-test.js`: Teste em estágios (rampa até 20 VUs, sustentação e desaceleração ao longo de 60s) com limiares rígidos (`p(95) < 500ms`, taxa de erro `< 5%`).

* **Comandos de Execução**:
  ```bash
  # Na raiz do monorepo:
  npm run test:k6        # Executa o smoke test do servidor via Docker Compose
  npm run test:k6:load   # Executa o teste de carga estagiado

  # Diretamente em apps/server:
  npm run test:k6:smoke
  npm run test:k6:load
  ```

> **Aviso de Governança (`AGENTS.md`):** Nunca execute alterações diretas no esquema do banco de dados (`schema.prisma`) ou crie migrações sem alinhamento e autorização prévia da equipe.
---

## 7. Gestão semanal de atividades — Interface mobile/web

A aplicação mobile/web possui a tela protegida `/(protected)/activities`, disponível na Home para os papéis `admin` e `protector`. Ela permite listar e cadastrar atividades semanais com título, descrição, tipo, data, horário, local e número de vagas. Data e horários são selecionados pelos controles nativos do navegador ou do celular, sem digitação manual.

Nesta etapa, as atividades são persistidas apenas no `AsyncStorage` do dispositivo pela chave `@kapa/weekly-activities`, seguindo o padrão do cadastro local de voluntários. Não foram criados endpoints, tabelas, migrações ou alterações de autorização no servidor. A sincronização real e a autorização no backend deverão ser implementadas e revisadas em uma etapa posterior.

---

## 8. População de dados de desenvolvimento

O backend possui um comando de população explícito do Prisma (`npm run prisma:seed` em `apps/server`). Ele cria ou atualiza uma conta administrativa local com o papel `admin` e a regra `admin:*`, sem alterar o esquema ou criar migrações.

As credenciais são lidas somente de `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` no arquivo local `apps/server/.env`, que é ignorado pelo Git. O comando é bloqueado quando `NODE_ENV=production`.

---

## Integração com feature/cadastros-ong

As rotas de cadastro, login e administração em `/api/auth` e as rotas de animais e upload da branch de cadastros são preservadas. O login Google e as rotas `/api/users` usam os controladores recebidos de weekly-activities. Os serviços Docker de inicialização do storage e testes k6 coexistem. A suíte de testes executa os testes de ambas as branches. Nenhum esquema ou migração foi alterado.

### Compatibilidade de autenticação após o merge

Os dois fluxos emitem JWT com o mesmo segredo obrigatório, emissor, audiência e expiração curta. Novas senhas usam scrypt; hashes legados de weekly-activities continuam aceitos, com comparação em tempo constante. O cliente compartilha a sessão entre os cadastros existentes e o login recebido, e normaliza a URL da API para evitar `/api/api`. O login Google exige uma audiência configurada. Os testes usam tsx para resolver os fontes do pacote compartilhado, mantendo a compilação TypeScript prévia.

### Funcionalidades de cadastros preservadas

### Interface mobile e web

- As telas de cadastro de animal e cadastro de voluntário foram convertidas de `StyleSheet` e estilos inline para NativeWind/Tailwind.
- Os arquivos antigos `styles.ts` dessas duas telas foram removidos.
- Foi criado o token Tailwind `shadow-card` para preservar a aparência dos cartões.
- Layouts e componentes relacionados foram ajustados para usar as classes do design system existente.
- O seletor de foto informa que a imagem é opcional e mantém seu conteúdo centralizado.
- `PrimaryInputText` passou a aceitar entrada segura de senha.
- O formulário de login foi conectado à API.
- A antiga tela de cadastro de voluntário foi transformada em cadastro geral de usuários.
- A nova rota `/cadastro-usuario` só pode ser acessada por administradores autenticados e permite selecionar `adopter`, `protector`, `volunteer` ou `admin`.
- A URL anterior `/cadastro-voluntario` redireciona para `/cadastro-usuario` para preservar links existentes.
- O formulário de animal converte os campos legados em português para o formato de domínio usado pela API.
- Erros de cadastro de animal agora distinguem sessão expirada, erro retornado pela API e indisponibilidade do servidor.
- A rota visual `/cadastro-animal` está pública temporariamente. O backend continua protegido.

### API, autenticação e segurança

- Foram adicionadas as rotas:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/users`, exclusiva para administradores
- O cadastro público de usuários aceita apenas os papéis `adopter` e `volunteer`. Não é permitido criar `admin` ou `protector` por autorregistro.
- A criação administrativa aceita todos os papéis definidos pelo enum `UserRole` e não substitui a sessão do administrador que fez o cadastro.
- Senhas são armazenadas com `scrypt`, salt aleatório e comparação segura.
- Tokens JWT usam HS256 e validam algoritmo, emissor, audiência e expiração.
- Foram adicionados middlewares de autenticação, autorização por papel e validação com Zod.
- O repositório de usuários foi corrigido para mapear corretamente nome e e-mail.
- A persistência de animais passou a usar PostgreSQL em vez do repositório em memória.
- O cadastro de animais é permitido no servidor para `protector`, `admin` e `volunteer` autenticados.
- O limite global de JSON e formulário URL-encoded é de 1 MB.
- O header `x-powered-by` do Express foi desabilitado.
- O tratamento de erros foi ajustado para não expor detalhes internos.
- A rota antiga duplicada de animais permanece removida. A verificação de hashes legados foi mantida apenas para compatibilidade com contas da outra branch.

### Upload opcional de foto

- A foto não é obrigatória para cadastrar um animal.
- Quando existe uma foto, o cliente primeiro cria o animal e depois envia um `multipart/form-data` para `POST /api/animals/:id/photos`.
- São aceitos JPEG, PNG e WebP com no máximo 5 MB.
- O servidor verifica a assinatura binária real do arquivo, e não apenas o nome ou MIME informado pelo cliente.
- O arquivo é armazenado em serviço compatível com S3; localmente é usado o MinIO.
- A URL é registrada na tabela já existente `tb_animal_photos`.
- Nenhuma migration ou alteração de schema foi criada para o upload.
- Se o banco falhar depois do envio ao storage, o backend tenta remover o objeto enviado para evitar arquivo órfão.
- Se somente o upload falhar, o animal permanece cadastrado e o cliente mostra uma mensagem específica.

### Banco de dados e infraestrutura

- PostgreSQL, Redis e MinIO estão configurados em `apps/server/docker-compose.yaml`.
- O Redis local exige senha.
- O MinIO cria automaticamente o bucket `kapa-public` por meio do serviço de inicialização `storage-init`.
- O bucket permite leitura pública das imagens; gravação continua restrita às credenciais S3 do backend.
- Os dados são persistidos nos volumes Docker `database_data`, `redis_data` e `storage_data`.
- Não houve alteração no schema existente do PostgreSQL.
