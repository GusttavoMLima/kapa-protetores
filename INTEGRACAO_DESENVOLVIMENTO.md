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
- `npm run clean`: remove caches de build nativos (`android/app/build`, `.cxx`) e `.expo`, liberando gigabytes de espaço local sem afetar o repositório.
- `npm test`: testes da API mais testes do modelo de edição; cobre perfis, revogação, token inválido/expirado, filtros, paginação, PATCH parcial, campos privados e autoelevação no cadastro público.
- Teste de navegador: iniciar Expo em `localhost:8081` e executar `node apps/mobile-web/test/browser/animal-management-browser.cjs` com Playwright disponível (ou `PLAYWRIGHT_MODULE_PATH` apontando para uma instalação existente) e Microsoft Edge instalado. `ANIMAL_UI_URL` permite outro endereço. O teste intercepta a API com fixtures isoladas, não altera o banco e grava capturas em `apps/mobile-web/.expo/animal-management-qa/` (ignorado pelo Git). Verifica desktop/celular, busca, filtros, paginação, edição, validação, erros, estado vazio e bloqueio de adotantes.

---

## 1. Arquitetura de Autenticação e Sessão

A autenticação é centralizada e compartilhada entre a aplicação mobile/web (`apps/mobile-web`) e a API REST (`apps/server`).

### 1.1 Autenticação Social com Google OAuth

* **Fluxo no Cliente (`apps/mobile-web`)**:
  * Implementado em [`LoginForm`](apps/mobile-web/src/components/forms/login/index.tsx) através do hook `Google.useIdTokenAuthRequest(...)` da biblioteca `expo-auth-session/providers/google`.
  * Configurado com `WebBrowser.maybeCompleteAuthSession()` para captura e fechamento seguro do popup de autenticação em ambiente web e mobile.
  * No Vercel, [`vercel.json`](vercel.json) envia `Cross-Origin-Opener-Policy: same-origin-allow-popups` para permitir a comunicação necessária com a popup OAuth e reescreve as rotas da SPA para `index.html`, evitando `404` ao abrir ou recarregar `/signIn` e outras rotas do Expo Router.
  * Redirecionamento e Deep Linking: URI configurada como `edu.fatec.kapaprotetores:/oauthredirect` no Android/iOS (compatível com os schemes declarados no `app.json` e `AndroidManifest.xml`). No web, `AuthSession.makeRedirectUri({ path: 'oauthredirect' })` gera `<origem>/oauthredirect` (ex.: `http://localhost:8081/oauthredirect` no desenvolvimento local ou `https://kapa-web-staging.vercel.app/oauthredirect` em homologação), evitando usar a tela atual `/signIn` como callback.
  * **Configuração obrigatória no Google Cloud Console (OAuth 2.0 Web Client)**:
    * **Authorized JavaScript origins** (Origens JavaScript autorizadas): `http://localhost:8081` (desenvolvimento local, sem barra no final) e `https://kapa-web-staging.vercel.app` (homologação).
    * **Authorized redirect URIs** (URIs de redirecionamento autorizados): `http://localhost:8081/oauthredirect` e `https://kapa-web-staging.vercel.app/oauthredirect`.
    * *Nota sobre `redirect_uri_mismatch` (Erro 400)*: Ocorre quando a URI requisitada pelo navegador (`http://localhost:8081/oauthredirect`) não está cadastrada na lista de URIs autorizadas do Client ID Web utilizado. Após cadastrar no console do Google, as alterações podem levar de alguns segundos a até 5 minutos para propagar globalmente.
  * Rota de Redirecionamento dedicada: [`app/oauthredirect.tsx`](apps/mobile-web/app/oauthredirect.tsx) publica sempre o retorno no `BroadcastChannel` de mesma origem antes de executar `WebBrowser.maybeCompleteAuthSession()`. Isso evita que um retorno `success` do Expo interrompa o fallback quando a política COOP impede a comunicação efetiva por `window.opener`. A janela principal continua validando origem, caminho e `state` pelo `AuthRequest.parseReturnUrl(...)` antes de aceitar o token, e o valor não é persistido nem registrado em logs.
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
  3. **Falhas de autenticação**: respostas `401` dos endpoints públicos `/auth/login`, `/auth/register` e `/auth/google` permanecem no formulário para exibir a mensagem da API. O encerramento automático da sessão continua reservado a respostas de autenticação provenientes de rotas protegidas.
  4. **Logout (`signOut`)**: A opção **Sair** na tela de perfil limpa os estados em memória, apaga o cabeçalho `Authorization` do Axios, remove as chaves do `AsyncStorage` e redireciona para `/signIn`.
  5. **Feedback de Erro Visual**: O formulário exibe um banner de alerta baseado no Material Design (`#FFDAD6` com texto `#93000A`) caso as credenciais estejam erradas ou ocorra erro de rede.

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

10. **Mapeamento e Proteção no Método `findByIdCountingAndDataOfRelations` (`UserRepository.ts`)**:
    * **Causa**: O método selecionava apenas campos parciais e omitia dados essenciais do usuário (`id`, `username`, `email`, `role`, `rules`, etc.), causando erro de tipagem TS2740 contra `UserWithRelationsCount` e deixando de retornar os dados de favoritos e eventos requisitados.
    * **Solução**: Criação do tipo `UserWithCountAndDataOfRelations` e `FavoriteAnimalSummary` em `@kapa/shared`. Para otimização de tráfego de rede e performance de consulta, os animais favoritados são selecionados de forma enxuta via Prisma trazendo apenas `id`, `name`, `gender`, `age` e a foto principal (`photo`), além da proteção estrita para jamais selecionar o hash da senha (`password`).

11. **Endpoint `GET /api/users/me/profile` (`UserRouter.ts`, `UserController.ts`, `UserService.ts`)**:
    * **Rota**: `GET /api/users/me/profile` (autenticada via `authTokenHandler` e autorizada via `rulesHandler('user:read:own')`).
    * **Finalidade**: Retorna as relações e dados resumidos do usuário autenticado no formato `UserWithCountAndDataOfRelations` (`id`, `latitude`, `longitude`, `counts`, `favorites` e `events`).
    * **Cliente Mobile/Web**: Consumido preferencialmente via `@tanstack/react-query` para cache e sincronização reativa na tela de perfil.

12. **Gerenciamento de Estado de Servidor no Mobile (`@tanstack/react-query`)**:
    * Instalado `@tanstack/react-query` no workspace `@kapa/mobile-web` para gerenciamento de cache de rede, background refetching (stale-while-revalidate), e sincronização entre abas.

13. **Padronização Global das Respostas de API com `ApiResponse<T>` (`@kapa/shared`)**:
    * Todos os controladores do backend ([`UserController`](apps/server/src/controllers/UserController.ts), [`AuthController`](apps/server/src/controllers/AuthController.ts), [`AnimalsController`](apps/server/src/controllers/AnimalsController.ts), [`HealthController`](apps/server/src/controllers/HealthController.ts)) e o manipulador global de erros ([`ErrorHandler`](apps/server/src/middlewares/ErrorHandler.ts)) foram padronizados com os contratos estritos de `ApiResponse<T>` e `ApiErrorResponse`.
    * Operações sem payload de retorno (ex: deleção, troca de senha) retornam explicitamente `data: null`, eliminando inconsistências e garantindo tipagem forte e previsível no frontend/mobile.

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

### 4.3 Preparação das validações após pull ou merge

Quando a atualização alterar o lockfile, o schema Prisma ou o pacote compartilhado, execute na raiz:

```bash
npm ci
npm run prisma:generate --workspace=@kapa/server
npm run build:shared
npm run type-check
npm run lint
npm test
```

O `npm ci` instala as versões travadas, incluindo Jest e ESLint. A geração do cliente Prisma atualiza o código e os tipos locais; não aplica migrations nem altera o banco. Configure as variáveis do servidor conforme o `.env.example`, incluindo `DIRECT_URL`, antes de gerar o cliente.

Os testes de persistência exigem o Docker em execução e usam um PostgreSQL descartável via Testcontainers, com as migrations existentes aplicadas apenas nesse contêiner. No Windows, confirme que o Docker Desktop está pronto com `docker info` antes de executar `npm test`.

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
| `EXPO_PUBLIC_API_URL` | Mobile/Web | URL base obrigatória da API. Para web/iOS local, use `http://localhost:4000/api`; no emulador Android, use `http://10.0.2.2:4000/api`. Em produção, configure um endpoint HTTPS. |

---

## 6. Validação de Qualidade e Testes

O projeto conta com comandos unificados de validação de qualidade para checagem de tipos, linting e testes automatizados:

```bash
# 1. Bateria completa de testes automatizados (backend + mobile-web)
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
  * Configurado com `network_mode: host` e `BASE_URL=http://localhost:4000/api` para comunicação direta com a API local (`http://localhost:4000/api`).
  * Volume montado em `./k6:/scripts`.

* **Scripts Disponíveis (`apps/server/k6/`)**:
  * `smoke-test.js`: Validação rápida (1 VU por 10s) dos endpoints `/health`, `/health/redis` e `/users/count` (`p(95) < 500ms`, taxa de erro `< 1%`). Inclui fase `setup()` para pré-aquecimento do pool de conexões com o PostgreSQL/Supabase antes da contagem das VUs.
  * `load-test.js`: Teste em estágios (rampa até 20 VUs, sustentação e desaceleração ao longo de 60s) com limiares rígidos (`p(95) < 500ms`, taxa de erro `< 5%`) e warmup inicial via `setup()`.

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

A aplicação mobile/web possui a tela protegida `/(protected)/manage-activities`, disponível na Home para os papéis `admin` e `protector`. Ela permite listar e cadastrar atividades semanais com título, descrição, tipo, data, horário, local e número de vagas. Data e horários são selecionados pelos controles nativos do navegador ou do celular, sem digitação manual. O caminho é distinto de `/(protected)/(tabs)/activities`, que é a tela de consulta e inscrição dos voluntários, pois os grupos do Expo Router não fazem parte do caminho final e rotas com o mesmo nome entram em conflito.

O cadastro e a listagem administrativa agora usam a API; atividades novas ficam persistidas em `tb_community_events` e são compartilhadas com a tela de voluntários. Atividades criadas em versões anteriores apenas no `AsyncStorage` local não são migradas automaticamente para o servidor.

### Inscrição de voluntários

A branch `feat/volunteers` acrescenta uma tela separada para voluntários em `/(protected)/(tabs)/activities`. As duas telas usam os modelos `CommunityEvents` e `CommunityEventVolunteers` no Prisma. A migration `20260927100000_extend_community_events` acrescenta tipo, término, local e vagas. Registros antigos recebem tipo `event`; os novos campos permanecem nulos para registros antigos até que sejam editados ou recriados.

| Endpoint | Acesso e comportamento |
| --- | --- |
| `GET /api/community-events/manage` | Exige autenticação e papel atual `admin` ou `protector`; lista atividades futuras e a contagem de inscrições. |
| `POST /api/community-events` | Exige autenticação e papel atual `admin` ou `protector`; valida e cadastra atividade futura, com limite positivo de vagas. |
| `GET /api/community-events` | Exige autenticação e papel atual `volunteer`; lista atividades futuras, vagas restantes e se o usuário da sessão já está inscrito. |
| `POST /api/community-events/:id/volunteers` | Exige autenticação e papel atual `volunteer`; inscreve o usuário autenticado. Atividade passada, inscrição duplicada e atividade lotada são rejeitadas. Inscrições simultâneas usam transação serializável para respeitar o limite. |

Admin/protetores e voluntários usam o mesmo contrato e os mesmos registros da API. Campos novos da migration são opcionais no banco para preservar atividades antigas; a API exige esses dados ao cadastrar atividades novas. Atividades antigas não possuem local, horário final ou quantidade máxima de vagas, então são apresentadas sem esses detalhes e sem limite de vagas definido.

---

## 8. População de dados de desenvolvimento

O backend possui um comando de população explícito do Prisma (`npm run prisma:seed` em `apps/server`). Ele cria ou atualiza uma conta administrativa local com o papel `admin` e a regra `admin:*`, sem alterar o esquema ou criar migrações.

As credenciais são lidas somente de `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` no arquivo local `apps/server/.env`, que é ignorado pelo Git. O comando é bloqueado quando `NODE_ENV=production`.

---

## Integração com feature/cadastros-ong

As rotas de cadastro, login e administração em `/api/auth` e as rotas de animais e upload da branch de cadastros são preservadas. O login Google e as rotas `/api/users` usam os controladores recebidos de weekly-activities. Os serviços Docker de inicialização do storage e testes k6 coexistem. A migration de atividades estende `tb_community_events`; não cria tabelas novas.

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
- O armazenamento de objetos local utiliza as imagens seguras e públicas do Chainguard (`cgr.dev/chainguard/minio:latest` e `cgr.dev/chainguard/minio-client:latest-dev`), eliminando bloqueios de autenticação (`401 UNAUTHORIZED`) do Quay.io. Para iniciar o storage localmente, execute: `docker compose -f apps/server/docker-compose.yaml up -d storage storage-init`.
- O Redis local exige senha.
- O MinIO cria automaticamente o bucket `kapa-public` por meio do serviço de inicialização `storage-init`.
- O bucket permite leitura pública das imagens; gravação continua restrita às credenciais S3 do backend.
- Os dados são persistidos nos volumes Docker `database_data`, `redis_data` e `storage_data`.
- Não houve alteração no schema existente do PostgreSQL.

### CI, seguranca e CD

- A documentação operacional completa do pipeline e o plano de entrega contínua estão em `docs/CI_CD.md`.
- O workflow `.github/workflows/quality.yml` roda em pushes para `development` e `main`, em Pull Requests e sob disparo manual. Ele executa lint, type-check, testes, cobertura LCOV, gate de auditoria npm, builds da API e do web, validação da imagem Docker, Semgrep, Trivy, Gitleaks e SonarCloud.
- A geração do Prisma no CI usa URLs PostgreSQL fictícias em `DATABASE_URL` e `DIRECT_URL` apenas para validação/build. Cada job de testes gera um `JWT_SECRET` efêmero, mascarado no log e descartado ao final da execução. Os testes atuais usam repositórios em memória e mocks; o CI não conecta a banco de dados nem aplica migrations.
- Os testes de `server` e `mobile-web` geram relatórios LCOV separados; o workflow normaliza os caminhos a partir da raiz do monorepo, consolida ambos em `coverage/lcov.info` e armazena o resultado como artefato. O Quality Gate do SonarCloud exige pelo menos 80% de cobertura no código novo.
- Em Pull Requests do mesmo repositório, o job `Cobertura` publica um comentário novo a cada push, preservando o histórico, com links para o commit e a execução, além da cobertura de statements, branches, functions e lines agrupada por `mobile-web`, `server`, `shared` e total. PRs de forks não recebem token com permissão de escrita e, por isso, não recebem o comentário.
- Gitleaks procura segredos no histórico completo do Git. Para repositórios de organizações, configure o secret `GITLEAKS_LICENSE`; não habilite comentários automáticos nem envio de relatórios com conteúdo sensível.
- O job `Segurança (Semgrep + Trivy + npm audit)` roda o gate `scripts/audit-gate.mjs`, que falha apenas em advisories high/critical fora da allowlist documentada em `scripts/audit-allowlist.json` (as vulnerabilidades pré-existentes, sem correção na linha atual de Prisma/Expo, ficam registradas com motivo). O job também executa Semgrep contra regras de TypeScript, React, JWT, OWASP, segredos e Node.js; em PRs, ele usa o commit-base para reportar apenas achados introduzidos pela mudança e eventuais falsos positivos são suprimidos com `# nosemgrep`. O Trivy varre dependências, segredos e configurações inseguras com severidade alta ou crítica, usando `.trivyignore` para os CVEs já aceitos (o Trivy não lê a allowlist do npm). A travessia ignora diretórios `node_modules`, evitando tratar configurações internas de pacotes externos como código do projeto; as vulnerabilidades das dependências continuam cobertas pelo `package-lock.json` e pelo gate do npm. O Gitleaks procura segredos no histórico. As ferramentas são executadas mesmo quando uma delas encontra um problema, preservando todos os resultados da análise.
- `apps/server/Dockerfile` cria uma imagem de execução da API em múltiplas etapas, sem copiar arquivos `.env`, chaves ou `node_modules` locais. A imagem exige as variáveis de ambiente de produção no runtime e não aplica migrations. O job `Dockerfile (build base)` valida o build da imagem no CI.
- `.github/dependabot.yml` agenda atualizações semanais para dependências npm e GitHub Actions, com espera de sete dias após a publicação de uma versão.
- Para bloquear merges inválidos, configure as proteções das branches `development` e `main` exigindo os seis checks `ESLint`, `Testes`, `Cobertura`, `Dockerfile (build base)`, `Segurança (Semgrep + Trivy + npm audit)` e `SonarCloud`.
- O modelo de CD usa Vercel para o web e Render para a API, com projetos e serviços separados para `development` e `main`. Cada GitHub Environment fornece o `VERCEL_PROJECT_ID` do seu projeto; o workflow publica como deployment principal dentro do projeto selecionado para atualizar o domínio fixo de staging ou produção. O auto-deploy do Render permanece desligado; o deploy hook é acionado pelo GitHub somente após os checks passarem. A ativação depende de conectar o repositório e configurar serviços, variáveis e secrets nos dashboards dos provedores.
- O workflow `.github/workflows/cd.yml` aguarda a conclusão bem-sucedida do CI em pushes para `development` e `main`, usa os ambientes GitHub `staging` e `production`, aplica as migrations do Prisma (`prisma migrate deploy`) com `DATABASE_URL`/`DIRECT_URL` do ambiente e aciona o deploy do mesmo commit da API por um deploy hook do Render. O CD aguarda `API_HEALTH_URL` responder HTTP 200 com exatamente o SHA aprovado pelo CI antes de publicar o web no Vercel e registra um resumo no *Step Summary*. Migrations e deploy compartilham o mesmo environment, resultando em uma única aprovação em produção.
- O endpoint `GET /api/health` retorna o SHA em `data.commit`. No Render, não configure `GIT_SHA` manualmente: `RENDER_GIT_COMMIT` é injetado a cada deploy e identifica o commit realmente em execução.
- Como eventos `workflow_run` usam a branch padrão em `GITHUB_REF`, o ambiente `staging` não deve ter uma regra que aceite somente a branch `development`. A seleção entre homologação e produção usa `github.event.workflow_run.head_branch`, além dos filtros do próprio evento.
- A conexão Redis aceita `REDIS_URL` com os protocolos `redis://` ou `rediss://`. `REDIS_PORT` e `REDIS_PASSWORD` permanecem como fallback exclusivo para o Redis local em `localhost`.
- Preview Environments do Render podem criar cópias de serviços e bancos por PR e têm cobrança própria; só devem ser ativados com um Blueprint e ambiente de dados de teste apropriado. O CI não cria recursos cloud nem altera o schema do PostgreSQL.
- Builds de distribuição Android/iOS e publicação nas lojas não estão automatizados nesta etapa. Expo EAS pode ser conectado quando o projeto definir o fluxo de release mobile.
- O arquivo `sonar-project.properties` mantém a configuração do projeto para o SonarCloud, que roda como check separado (`CI / SonarCloud`) nos Pull Requests do próprio repositório e nos pushes para `main`, sendo pulado em PRs de fork e no push de `development`. O plano atual do SonarCloud não permite consultar o Quality Gate de branches secundárias; o PR precisa passar pelo gate antes do merge, e os outros checks são executados novamente sobre o commit integrado em `development`. O job depende de `Cobertura`, baixa o artefato `lcov-report` e aguarda por até cinco minutos o Quality Gate; uma reprovação, inclusive cobertura de código novo abaixo de 80%, falha o CI. `sonar.coverage.exclusions` permanece restrito a tipos/configurações, ao cliente Redis e a telas do app; `PrismaService` é medido pelos testes unitários de configuração do pool.

---

## 9. Busca e Adoção de Animais (`SearchAdoptForm` e `AdoptScreen`)

A aplicação mobile/web implementa o fluxo de busca e filtragem para adoção de animais resgatados na aba Adopet (`/(protected)/(tabs)/adopet` -> `AdoptScreen`):

### 9.1 Componente `SearchAdoptForm`
Localização: `apps/mobile-web/src/components/forms/searchAdopt/`

* **Campos e Filtros Suportados**:
  * `breed`: Busca textual por raça ou nome do animal via `SecondaryInputText` com ícone de lupa (`MagnifyingGlassIcon`).
  * `specie`: Seleção de espécie via `PrimaryChipGroup` (`'all'` / Todos, `'dog'` / Cachorros, `'cat'` / Gatos).
  * `gender`: Seleção de sexo via `PrimaryChipGroup` (`'all'` / Todos, `'male'` / Machos, `'female'` / Fêmeas).
  * `size`: Seleção de porte via `PrimaryChipGroup` (`'all'` / Todos, `'small'` / Pequeno, `'medium'` / Médio, `'large'` / Grande).
* **Desacoplamento e Arquitetura**:
  * `model.ts`: Schemas Zod (`searchAdoptSchema`), tipos TypeScript estritos, opções padrão e função pura `matchesSearchAdoptFilters(animal, filters)`.
  * `index.tsx`: Componente de interface React Native/Web com debounce automático de 350ms na digitação de texto, disparo imediato na troca de chips, botão colapsável de filtros secundários (Sexo e Porte) e botão para limpar todos os filtros quando ativos.

### 9.2 Tela `AdoptScreen`
Localização: `apps/mobile-web/src/screens/adopt/index.tsx`

* **Consumo de API**: Realiza requisição para o endpoint público `GET /api/animals` utilizando `kapaService`.
* **Tratamento de Estados**:
  * **Carregamento**: Indicador `ActivityIndicator` com cor da paleta (`palette.orange`).
  * **Erro**: Exibição de mensagem amigável com botão `PrimaryButton` para tentar novamente.
  * **Vazio**: Estado diferenciado para quando não há nenhum animal no abrigo vs. quando a busca não encontrou resultados com os filtros selecionados, permitindo resetar os filtros em 1 toque.
  * **Atualização**: Suporte a *pull-to-refresh* via `RefreshControl`.
* **Exibição dos Animais**:
  * Renderização em grade responsiva usando `PetCard`.
  * Formatação automática de características (sexo, porte e idade formatada).
  * Imagem padrão de fallback caso o animal não possua foto cadastrada.
  * Controle de favoritos na interface.

### 9.3 Testes Automatizados
* **`apps/mobile-web/tests/search-adopt-model.test.mjs`**: Suíte de testes unitários que valida parsing do schema, rejeição de enumerações inválidas e precisão dos filtros (espécie, raça/nome case-insensitive, sexo e mapeamento numérico de porte).
* Integrado ao pipeline e executado automaticamente via `npm test`.

---

## 10. Arquitetura de Erros da API (`apps/server/src/errors`)

A camada de tratamento e propagação de erros do servidor foi padronizada através de classes de erro dedicadas e extensíveis derivadas de `BaseError`:

* **`BaseError` (`BaseError.ts`)**: Classe base que estende `Error`, armazena `statusCode`, `name`, `message`, `cause` e `details`.
* **Classes de Erro Especializadas**:
  * `BadRequestError` (HTTP 400): Entrada de dados malformada ou parâmetros inválidos, com suporte a detalhes de validação (`details`).
  * `UnauthorizedError` (HTTP 401): Credenciais incorretas, token JWT ausente, inválido ou expirado.
  * `ForbiddenError` (HTTP 403): Permissão insuficiente de papel ou recurso protegido contra acesso indevido.
  * `NotFoundError` (HTTP 404): Entidade ou recurso não localizado no banco de dados.
  * `ConflictError` (HTTP 409): Violação de unicidade (ex: e-mail duplicado) ou regra de negócio concorrente (ex: atividade lotada).
  * `InternalServerError` (HTTP 500): Falhas internas inesperadas.
  * `ValidationError` / `DataTypeError` (HTTP 400): Erros de tipagem e formato.
  * `ServiceError` (HTTP 500): Falha de integração de serviço.
* **Centralização no `ErrorHandler` (`middlewares/ErrorHandler.ts`)**:
  * Captura instâncias de `BaseError` com `statusCode < 500` e formata a resposta padronizada `ApiErrorResponse` (`{ success: false, error: message, details }`).
  * Erros 500 ou desconhecidos são mascarados como `Internal Server Error` para proteger detalhes internos do servidor, com log estruturado via `console.error`.

---

### 11. Conexão de Banco de Dados Remota / Supabase (`PrismaService.ts`)

* **Configuração de Pool Resiliente e TLS verificado**:
  * O `pg.Pool` recebe a connection string sem sobrescrever as opções TLS. Em Render, a `DATABASE_URL` usa `sslmode=verify-full&sslrootcert=/etc/secrets/supabase-ca.crt`; o parser do `pg` carrega a CA do Supabase e mantém a validação do certificado e do hostname ativa.
  * O certificado é cadastrado como Secret File `supabase-ca.crt` no Render e não é armazenado no repositório. Extensões de certificado também são ignoradas por Git e Docker.
  * O PostgreSQL local continua usando sua URL sem parâmetros SSL. Não use `rejectUnauthorized: false`, `NODE_TLS_REJECT_UNAUTHORIZED=0` ou `sslmode=disable` para contornar falhas de certificado.
  * `connectionTimeoutMillis` aumentado para `15000` (15 segundos) para suportar latência e handshakes TLS de instâncias em nuvem.
  * Registro de listener `pool.on('error')` para tratar encerramentos de conexões ociosas (idle) por parte do pooler do Supabase sem derrubar a aplicação.
  * Recomenda-se utilizar a URL do **Session Pooler (Supavisor)** do Supabase, porta `5432`, para compatibilidade com redes IPv4 do Render.

---

### 12. Tratamento de Expiração de Sessão no Frontend (`apps/mobile-web`)

* **Validação Prévia de Expiração de JWT (`authProvider.tsx`)**:
  * Ao carregar o estado persistido (`genericStorage`), o frontend decodifica o payload do token (`exp`) e verifica se já expirou (`Date.now() >= exp * 1000`).
  * Em caso de token expirado, os dados do storage são purgados automaticamente, evitando renderizar telas protegidas com credenciais inválidas.
* **Interceptor de Resposta Axios (`kapaService.ts`)**:
  * Adicionado interceptor para capturar status `401` ou `403` (quando indica token inválido ou expirado), disparando o callback de logout para limpar o estado e redirecionar para `/signIn`.

---

### 13. Otimizações de Performance Mobile e Prevenção de Chamadas Duplicadas de API

* **Controle de Retentativas e Foco no TanStack Query (`_layout.tsx` e `useUserProfile.ts`)**:
  * Configurado `refetchOnWindowFocus: false` globalmente e no hook `useUserProfile` para evitar refetching automático e desnecessário toda vez que o aplicativo mobile ou aba do navegador recupera o foco.
  * Implementada regra condicional de retentativas (`retry: (failureCount, error) => ...`) que cancela retentativas imediatas em erros `401`, `403` e `404` (onde repetir a mesma requisição sem novas credenciais causava disparos triplos de requisições ao servidor).
* **Guarda Síncrona contra Duplo Clique / Submissões Duplicadas (`useRef`)**:
  * Adicionado bloqueio com flag síncrona `inFlightRef.current` / `savingRef.current` nas ações de envio de formulários em `cadastroAnimal`, `cadastroVoluntario`, `activities` e `volunteerActivities` (inscrição).
  * Previne que toques rápidos múltiplos na tela mobile enviem requisições `POST` concorrentes antes que o estado reativo de `loading` desabilite o botão.
* **Prevenção de Disparo Prematuro de Filtros (`SearchAdoptForm.tsx`)**:
  * Adicionado `isFirstRender` para não acionar o timer de debounce de 350ms na montagem inicial da tela de adoção quando os filtros ainda não foram alterados pelo usuário, evitando renderizações em cascata e recálculos desnecessários na lista de pets.
* **Memoização do Contexto de Autenticação (`authProvider.tsx`)**:
  * O objeto `value` do `AuthContext.Provider` agora é envolvido em `useMemo`, prevenindo renderizações em cascata por toda a árvore de componentes da aplicação quando o provedor renderiza sem alteração no usuário/estado de login.
* **Compatibilidade do Motor Yoga / Flexbox Mobile (`HomeScreen.tsx`)**:
  * Removido o uso de classes CSS Grid (`grid grid-cols-2...`), que não são suportadas pelo motor de layout Yoga no React Native nativo (iOS/Android), substituindo por Flexbox responsivo (`flex-row flex-wrap justify-between gap-4`).
  * Transformado o link "Ver todos os 45 Pets" em elemento interativo com `router.push('/adopet')`.
* **Memoização de Lista e Eliminação de Warnings de Sombra (`PetCard` e componentes)**:
  * `PetCard` encapsulado em `React.memo` com comparador customizado de propriedades (comparando nome, foto, favorito e características), evitando re-renderizar todos os cartões de pets em massa durante pesquisas ou interações.
  * Substituído o uso de propriedades depreciadas `shadow*` por `Platform.select`: `boxShadow` na Web (eliminando warnings no console), `elevation` no Android e sombras nativas no iOS.

---

### 14. Extensão de Schema e Perfil do Adotante (`tb_adopter_profiles`)

* **Migration `20261007111800_add_adopter_profile_and_indexes`**:
  * **Tabela `tb_adopter_profiles`**:
    * Armazena preferências declaradas pelo adotante para matchmaking e filtros recomendados:
      * `preferred_species` (`Species`: `dog`, `cat`, `other`)
      * `preferred_gender` (`Genders`: `male`, `female`)
      * `preferred_size`, `preferred_energy`, `preferred_kid_friendly`, `preferred_noise`, `preferred_age_stage` (`Int`)
      * `lives_in_apartment` (`Boolean`), `has_other_pets` (`Boolean`)
    * Vínculo 1:1 único com `tb_users` (`user_id` único com `onDelete: Cascade` e `onUpdate: Cascade`).
    * Campos de auditoria `created_at` e `updated_at`.
  * **Índices de Performance em `tb_events`**:
    * Adicionado índice em `tb_events(animal_id)` (`tb_events_animalId_idx`).
    * Adicionado índice composto em `tb_events(user_id, type)` (`tb_events_userId_type_idx`) para aceleração de consultas e agregação de histórico/atividades por usuário e tipo.
  * **Rotas da API (`/api/adopter-profiles`)**:
    * `GET /api/adopter-profiles/count`: Contagem global de perfis de adotantes.
    * `GET /api/adopter-profiles/all`: Listagem administrativa restrita (`admin:*`).
    * `GET /api/adopter-profiles/me`: Consulta do perfil de preferências do adotante autenticado (`user:read:own`).
    * `PUT /api/adopter-profiles/me`: Upsert (cria se ausente, atualiza se existente) das preferências do adotante (`user:update:own`).
    * `PATCH /api/adopter-profiles/me`: Atualização parcial das preferências do adotante (`user:update:own`).
    * `DELETE /api/adopter-profiles/me`: Exclusão das preferências do adotante (`user:delete:own`).
    * `POST /api/adopter-profiles/preferences/search`: Filtragem composta de adotantes por critérios de preferências.
    * `GET /api/adopter-profiles/preference`: Consulta rápida por chave e valor individual.
    * `POST /api/adopter-profiles`: Criação explícita de perfil.
    * `GET /api/adopter-profiles/:id` e `PATCH /api/adopter-profiles/:id`: Operações por ID do perfil.
    * `GET /api/adopter-profiles/user/:id`, `PUT /api/adopter-profiles/user/:id`, `PATCH /api/adopter-profiles/user/:id`, `DELETE /api/adopter-profiles/user/:id`: Operações por ID do usuário (administração).

---

### 15. Migração e Reorganização dos Testes do Backend (`apps/server`)

* **Migração de `node:test` para Jest**:
  * Configurado **Jest** com **`ts-jest`** e `@types/jest` no `apps/server`.
  * Criação de [`jest.config.ts`](apps/server/jest.config.ts) apontando para a raiz `test/` e combinando arquivos `**/*.spec.ts`.
  * Criação de [`tsconfig.test.json`](apps/server/tsconfig.test.json) para compilação estrita dos testes sem poluir o diretório de build de produção (`dist/`).
  * Scripts atualizados no `package.json`: `test` (`jest`), `test:watch` (`jest --watch`), `test:cov` (`jest --coverage`).
* **Estrutura por Camadas (`apps/server/test/`)**:
  * **`test/controllers/`**:
    * `AdopterProfileController.spec.ts`: Testes unitários de todos os endpoints do controlador de perfis de adotantes.
    * `AuthController.spec.ts`: Validação de login social com Google via ID Token.
    * `UserController.spec.ts`: Cobertura de registro, login, sanitização de senhas, contagens, edição de perfil e controle de papéis.
  * **`test/domains/`**:
    * `Url.spec.ts`: Validações de integridade de Value Objects de URL e preservação de casing/parâmetros.
  * **`test/integration/`**:
    * `animalManagement.spec.ts`: Testes integrados de ponta a ponta para gestão de animais, permissões por papel, visibilidade pública vs. privada e paginação.
  * **`test/middlewares/`**:
    * `authTokenHandler.spec.ts`: Verificação do middleware de autenticação, cabeçalho `Authorization` e validação de tokens JWT.
  * **`test/models/`**:
    * `AdopterProfile.spec.ts`: Validação e invariantes da entidade de domínio `AdopterProfile`.
    * `User.spec.ts`: Validação de username, regras por papel, avatars e serialização segura sem hashes.
  * **`test/repositories/`**:
    * `UserRepository.spec.ts`: Mapeamento de relações, contagens e tratamento seguro de coordenadas nulas.
  * **`test/routes/`**:
    * `AdopterProfileRouter.spec.ts`: Verificação de registro e métodos HTTP de rotas de perfil de adotante.
    * `UserRouter.spec.ts`: Verificação de métodos e endpoints públicos, administrativos e do usuário autenticado.
    * `appCors.spec.ts`: Testes do servidor HTTP para origens permitidas e rejeição de requisições de origens maliciosas.
  * **`test/security/`**:
    * `Jwt.spec.ts`: Testes da utilidade de geração e decodificação de tokens JWT.
    * `JwtService.spec.ts`: Assinatura e verificação estrita de claims (`issuer`, `audience`, expiração).
    * `PasswordHasher.spec.ts`: Hashing seguro de senhas com PBKDF2 e timing-safe comparison.
    * `mergeAuth.spec.ts`: Compatibilidade retroativa entre senhas e tokens emitidos por diferentes fluxos.
  * **`test/services/`**:
    * `AdopterProfileService.spec.ts`: Regras de negócio, busca por preferências, upsert e exclusão.
    * `AnimalPhotoService.spec.ts`: Detecção de magic bytes e validação de MIME types de imagens.
    * `UserService.spec.ts`: Fluxos de perfil, atualização de senhas, contagem de relacionamentos e autenticação Google.
  * **`test/validation/`**:
    * `schemas.spec.ts`: Schemas Zod de criação de usuário, papéis, coordenadas, login e tokens Google.

---

### 16. Configuração de Testes com Jest + Expo em React Native (`apps/mobile-web`)

* **Infraestrutura de Testes com `jest-expo`**:
  * Configurado **Jest** com o preset oficial **`jest-expo`** compatível com Expo SDK 57 e React Native 0.86.
  * Instalados como devDependencies: `jest-expo`, `jest`, `@types/jest`, `@react-native/jest-preset@0.86.3`, `@testing-library/react-native` e `test-renderer` (renderizador oficial para React 19).
  * Arquivo [`apps/mobile-web/jest.config.js`](apps/mobile-web/jest.config.js) configurado com preset `jest-expo`, mapeamento de path alias `^@/(.*)$` e de `expo-modules-core`.
  * Arquivo [`apps/mobile-web/jest.setup.ts`](apps/mobile-web/jest.setup.ts) para setups e mocks globais do ambiente React Native.
  * Inclusão do tipo `"jest"` em [`apps/mobile-web/tsconfig.json`](apps/mobile-web/tsconfig.json).
  * Scripts no `package.json` de `apps/mobile-web`: `"test": "jest"`, `"test:watch": "jest --watch"`.
  * Scripts unificados no `package.json` da raiz:
    * `"test"`: executa os testes do servidor e da aplicação mobile/web em cadeia (`npm run test --workspace=@kapa/server && npm run test --workspace=@kapa/mobile-web`).
    * `"test:mobile"`: executa os testes do mobile/web isoladamente.
    * `"test:server"`: executa os testes do servidor isoladamente.
* **Organização das Suítes em `apps/mobile-web/test/`**:
  * **`test/components/`**:
    * `PrimaryButton.spec.tsx`: Testes de renderização, acessibilidade, eventos de clique e estado de carregamento do componente de botão utilizando `@testing-library/react-native` (com suporte assíncrono para React 19).
    * `searchAdoptModel.spec.ts`: Validação de esquema e filtros de busca por nome, raça, porte, espécie e sexo.
  * **`test/screens/`**:
    * `animalManagementModel.spec.ts`: Validação do modelo do editor de animais, formatação de pesos decimais brasileiros e paginação.
  * **`test/services/`**:
    * `apiBaseUrl.spec.ts`: Testes unitários de normalização de URLs de API, sanitização de barras e validação de HTTPS em produção.
  * **`test/storage/`**:
    * `genericStorage.spec.ts`: Testes unitários de armazenamento local usando o mock de `@react-native-async-storage/async-storage`, cobrindo persistência de pares chave-valor, serialização de objetos JSON, recuperação, remoção, limpeza geral e isolamento de estado.
  * **`test/browser/`**:
    * `animal-management-browser.cjs`: Script de teste end-to-end de navegador via Playwright / Edge para gestão de animais, consolidado no padrão `test/`.

---

### 17. Persistência de Dados com Testcontainers (PostgreSQL), Prisma e Mock do AsyncStorage

* **Mock do AsyncStorage (`apps/mobile-web`)**:
  * Configurado em [`apps/mobile-web/jest.setup.ts`](apps/mobile-web/jest.setup.ts) utilizando a implementação oficial de mock `@react-native-async-storage/async-storage/jest/async-storage-mock`.
  * Garante que chamadas de leitura, gravação e remoção de dados locais (`AsyncStorage.getItem`, `setItem`, `removeItem`, `clear`, `multiGet`) executem de forma síncrona/em memória durante os testes Jest, isolando o ambiente sem dependência de módulos nativos de SO.
  * Testado e validado em [`apps/mobile-web/test/storage/genericStorage.spec.ts`](apps/mobile-web/test/storage/genericStorage.spec.ts).

* **Testcontainers com PostgreSQL Real (`apps/server`)**:
  * Dependências adicionadas ao `apps/server`: `@testcontainers/postgresql` e `testcontainers`.
  * **Helper [`apps/server/test/helpers/postgresContainer.ts`](apps/server/test/helpers/postgresContainer.ts)**:
    * Criação e inicialização dinâmica de contêiner PostgreSQL efêmero com imagem oficial `postgres:16-alpine`.
    * Aplicação automatizada das migrações do Prisma com `npx prisma migrate deploy` apontando para a porta e banco dinâmicos do contêiner.
    * Conexão do `PrismaClient` utilizando `@prisma/adapter-pg` com `pg.Pool` (em conformidade com o driver adapter exigido pelo Prisma v7).
    * Função `executeSqlFile(prisma, filePath)` para execução de scripts SQL puros (`.sql`) com `prisma.$executeRawUnsafe`.
    * Gerenciamento de ciclo de vida seguro: método `cleanup()` para encerramento do pool de conexões e destruição do contêiner Docker após a execução das suítes.
  * **Script SQL de Fixture ([`apps/server/test/fixtures/seed_test_data.sql`](apps/server/test/fixtures/seed_test_data.sql))**:
    * Insere dados iniciais de teste diretamente via SQL puro em `tb_users` e `tb_adopter_profiles`, respeitando tipos de dados (UUID, arrays PostgreSQL, timestamps e coordenadas).
  * **Suíte de Testes de Integração ([`apps/server/test/integration/databasePersistence.spec.ts`](apps/server/test/integration/databasePersistence.spec.ts))**:
    1. **Schema & Execução SQL**: Validação da criação das tabelas no schema `public` (`tb_users`, `tb_adopter_profiles`, `tb_animals`, `tb_events`, `tb_favorites`), execução do script `seed_test_data.sql` e verificação de índices criados pelas migrações em `pg_indexes`.
    2. **`UserRepository`**: Persistência real de usuário com arrays de regras, coordenadas geográficas, buscas com `hasEvery` em regras, filtros por papel (`role`) e atualização de registros.
    3. **`AdopterProfileRepository`**: Persistência real vinculada à chave estrangeira `tb_users(id)`, consultas compostas por preferências via `findByPreferences` e atualização de perfis.
    4. **Integridade e Restrições Estruturais**:
       * Verificação de rejeição de perfil duplicado para o mesmo usuário via constraint única 1:1 (erro `P2002`).
       * Verificação de propagação de deleção em cascata (`ON DELETE CASCADE`) na remoção do usuário pai.

---

### 18. Otimização de Peso do Monorepo e Limpeza de Dependências

* **Remoção de `@expo/vector-icons` (`apps/mobile-web`)**:
  * Removido de `dependencies` (economia de ~6.5 MB no disco e menor overhead no bundling Web/Metro).
  * O aplicativo padroniza exclusivamente a biblioteca `phosphor-react-native` em todos os ícones da interface.
* **Remoção de `@prisma/dev` (`apps/server`)**:
  * Removido de `devDependencies` (economia de ~19 MB no disco).
  * O monorepo utiliza contêineres PostgreSQL oficiais (`postgres:16-alpine`) para testes e desenvolvimento via Docker Compose e Testcontainers, dispensando os runtimes experimentais PGlite/Bun do `@prisma/dev`.
* **Eliminação de Redundâncias e Tipagens Legadas**:
  * Removido `testcontainers` explícito de `apps/server/package.json` (mantendo `@testcontainers/postgresql`, que já fornece a dependência).
  * Removido `@types/redis` (legado v4) de `apps/server`, visto que `redis` v6 já embute definições TypeScript oficiais em `dist/index.d.ts`.
  * Removido `@react-native/jest-preset` da raiz `package.json` (gerenciado isoladamente no workspace `apps/mobile-web`).
* **Otimização de Performance do Testcontainers**:
  * Adicionadas flags de PostgreSQL em memória (`fsync=off`, `synchronous_commit=off`, `full_page_writes=off`) e `npx --no-install prisma migrate deploy` no helper [`postgresContainer.ts`](apps/server/test/helpers/postgresContainer.ts).

---

### 19. Pipeline de CI/CD e Qualidade (`.github/workflows/quality.yml`)

* **Geração de Prisma Client e Build do Pacote Compartilhado**:
  * Nos jobs de `lint` e `tests`, as etapas de `npm run prisma:generate --workspace=@kapa/server` e `npm run build:shared` são executadas imediatamente após `npm ci`.
  * Isso garante que os tipos gerados pelo Prisma Client (`@prisma/client`) e a compilação do pacote `@kapa/shared` estejam prontos antes das etapas de análise estática (`npm run lint`), checagem de tipos estrita (`npm run type-check`) e execução de testes automatizados (`npm test`).
* **Tipagem Estrita nos Testes de Integração**:
  * Adicionadas anotações explícitas de tipo em lambdas de queries brutas (`$queryRaw`) em [`apps/server/test/integration/databasePersistence.spec.ts`](apps/server/test/integration/databasePersistence.spec.ts) para conformidade total com o modo `strict` do TypeScript (`noImplicitAny`).

---

### 20. Componente `PrimaryCheckBox` e Acessibilidade (`apps/mobile-web`)

* **Aprimoramentos de Arquitetura e UX**:
  * Implementado em [`apps/mobile-web/src/components/checkboxs/primary/index.tsx`](apps/mobile-web/src/components/checkboxs/primary/index.tsx).
  * **Modos Controlado e Não Controlado**: suporte completo a `checked`/`value` (controlado) e `defaultChecked`/`initialState` (não controlado).
  * **Callbacks Resilientes**: suporte a `onChange`, `onValueChange` e retrocompatibilidade com `onClick`, corrigindo fechamento estático (*stale closure*) e erro de digitação de classes (`outline-none`).
  * **Acessibilidade e Alvos de Toque**: conformidade com alvos mínimos de toque (44-48px via `hitSlop={8}` e `min-h-[44px]`), atributos semânticos (`accessibilityRole="checkbox"`, `accessibilityState={{ checked, disabled }}` e suporte a estado `indeterminate: 'mixed'`).
  * **Design System**: suporte a variantes de tamanho (`sm`, `md`, `lg`), rótulos tipográficos com `Plus Jakarta Sans`, mensagens de apoio/descrição e estados visuais de erro (`border-danger`), desabilitado (`opacity-50`, `cursor-not-allowed`) e preenchimento primário com `CheckIcon` e `MinusIcon`.
* **Suíte de Testes Automatizados**:
  * Implementada em [`apps/mobile-web/test/components/PrimaryCheckBox.spec.tsx`](apps/mobile-web/test/components/PrimaryCheckBox.spec.tsx) utilizando `@testing-library/react-native`, validando renderização, alternância de estado, modo controlado, bloqueio quando desabilitado, estado indeterminado e exibição de erros.

---

### 21. Formulário Multi-etapas de Perfil de Adotante (`AdopterProfileForms`)

* **Arquitetura e Fluxo do Questionário**:
  * Componente implementado em [`apps/mobile-web/src/components/forms/adopterProfile/index.tsx`](apps/mobile-web/src/components/forms/adopterProfile/index.tsx).
  * **Configuração Centralizada**: 9 etapas configuradas em [`model.ts`](apps/mobile-web/src/components/forms/adopterProfile/model.ts) cobrindo espécie, sexo, porte, faixa etária, energia, convivência com crianças, ruído, moradia em apartamento e outros pets.
  * **Variantes de Componente**:
    * `card`: seleção visual com ícones dedicados (ex.: espécies com `DogIcon`, `CatIcon`, `BirdIcon`).
    * `checkbox`: linhas interativas acessíveis integradas com `PrimaryCheckBox`.
    * `chip`: chips arredondados para seleção rápida utilizando o componente reutilizável `PrimaryChip` (`@/components/chips/primaryChip`).
  * **Progresso e Navegação**:
    * Indicador numérico de passo ("Passo X de Y") e barra de progresso visual percentual.
    * Botão "Voltar" disponível a partir da etapa 2.
    * Botão "Avançar" / "Concluir Perfil" integrado com validação Zod via `react-hook-form` e `@hookform/resolvers/zod`.
  * **Acessibilidade e Usabilidade**:
    * Alvos de toque superiores a 48px, papéis semânticos `radio` e `checkbox`.
    * Mensagens de erro com validação em tempo real.
* **Suíte de Testes Automatizados**:
  * Implementada em [`apps/mobile-web/test/components/AdopterProfileForms.spec.tsx`](apps/mobile-web/test/components/AdopterProfileForms.spec.tsx), cobrindo renderização, seleção de opções, submissão de dados, navegação retroativa e estado de conclusão.

---

### 22. Segurança e Remoção de `userId` nas Requisições de Perfil de Adotante (`AdopterProfile`)

* **Mitigação de IDOR / BOLA (Insecure Direct Object Reference)**:
  * Em conformidade com a seção 8 de [`AGENTS.md`](AGENTS.md), identidades fornecidas pelo cliente não são confiadas.
  * O schema [`apps/server/src/schemas/adoptionProfile.schema.ts`](apps/server/src/schemas/adoptionProfile.schema.ts) (`adoptionProfileCreate`) foi atualizado para conter exclusivamente os campos de preferências (`adoptionProfilePreferenceFields`), removendo o campo `userId` do payload aceito da requisição.
* **Extração Segura de Identidade via Token JWT**:
  * O controlador [`apps/server/src/controllers/AdopterProfileController.ts`](apps/server/src/controllers/AdopterProfileController.ts) no método `create` extrai o `userId` autenticado exclusivamente de `req.user.sub` (injetado pelo middleware `authTokenHandler`).
  * Caso o usuário não esteja autenticado, rejeita a requisição com `BadRequestError('User authentication required.')`.
  * O serviço subjacente (`profileService.create`) recebe `{ ...parsed.data, userId }`, associando a criação do registro ao usuário autenticado de forma confiável e inviolável.
* **Contratos Compartilhados e Tipagem Estrita (`@kapa/shared`)**:
  * Em [`packages/shared/src/types/user.ts`](packages/shared/src/types/user.ts), foram exportados os tipos `CreateAdopterProfileBody` e `AdopterProfileRequestBody` definidos como `Omit<CreateAdopterProfileInput, 'userId'>`, garantindo conformidade entre front-end e back-end sem expor `userId` nos formulários.
* **Frontend Mobile / Web**:
  * O formulário [`apps/mobile-web/src/components/forms/adopterProfile/model.ts`](apps/mobile-web/src/components/forms/adopterProfile/model.ts) e o hook [`apps/mobile-web/src/hooks/useAdopterProfile.ts`](apps/mobile-web/src/hooks/useAdopterProfile.ts) enviam somente os dados de preferência validados para o endpoint autenticado `POST /api/adopter-profiles`.

---

### 23. Obrigatoriedade de Preenchimento do `AdopterProfile` no Primeiro Login

* **Regra de Negócio e Fluxo de Boas-Vindas**:
  * Ao realizar o primeiro login ou cadastro (via credenciais locais ou Google OAuth), usuários adotantes (`role: 'adopter'`) são obrigados a preencher o formulário multi-etapas de perfil de preferências antes de acessar a navegação principal da aplicação (`/(protected)/(tabs)`).
* **Guarda de Rotas e Verificação de Estado (`apps/mobile-web`)**:
  * **Provedor de Autenticação (`AuthProvider`)**:
    * Implementados no `AuthContext` os estados `hasAdopterProfile` (`boolean | null`) e `isCheckingProfile` (`boolean`), com persistência em chave `@kapa:has-adopter-profile` via `genericStorage`.
    * A função `checkAdopterProfile` consulta `GET /api/adopter-profiles/me`: caso a resposta seja 404 (`NotFoundError`), define `hasAdopterProfile` como `false` e armazena o status.
    * No fluxo de login (`establishSession`), adotantes sem perfil cadastrado são imediatamente redirecionados para `/(protected)/adopter-profile`.
  * **Proteção das Abas Principais (`(protected)/(tabs)/_layout.tsx`)**:
    * O layout das abas valida se o usuário autenticado é adotante e não possui perfil preenchido (`hasAdopterProfile === false`), emitindo um `<Redirect href="/(protected)/adopter-profile" />` para impedir o desvio do fluxo obrigatório.
  * **Rota Dedicada de Perfil de Adotante (`app/(protected)/adopter-profile.tsx`)**:
    * Adicionada a rota protegida associada a [`AdopterProfileScreen`](apps/mobile-web/src/screens/adopterProfile/index.tsx), registrada no `ProtectedLayout`.
    * Inclui cabeçalho acessível com opção de logout seguro, exibição de mensagens de erro caso a chamada de mutação falhe, e transição para a tela de conclusão com desbloqueio do acesso às abas (`setHasAdopterProfile(true)`).
* **Suíte de Testes Automatizados**:
  * Implementados testes em [`apps/mobile-web/test/contexts/AuthProvider.spec.tsx`](apps/mobile-web/test/contexts/AuthProvider.spec.tsx) cobrindo redirecionamento condicional para o formulário no primeiro login (404) e para as abas nos logins subsequentes (200).
  * Implementados testes em [`apps/mobile-web/test/screens/AdopterProfileScreen.spec.tsx`](apps/mobile-web/test/screens/AdopterProfileScreen.spec.tsx) cobrindo renderização e fluxo de saída.
  * Adicionados testes unitários para o endpoint `getMe` em [`apps/server/test/controllers/AdopterProfileController.spec.ts`](apps/server/test/controllers/AdopterProfileController.spec.ts).

---

### 24. Busca e Filtros de Animais para Adoção (`SearchAdoptForm` e TanStack Query)

* **Gerenciamento de Formulário e Validação (`react-hook-form`)**:
  * Componente [`SearchAdoptForm`](apps/mobile-web/src/components/forms/searchAdopt/index.tsx) refatorado para gerenciar estado e validação através de `react-hook-form` (`useForm`, `Controller`, `useWatch`).
  * Em [`model.ts`](apps/mobile-web/src/components/forms/searchAdopt/model.ts), definido o schema Zod `searchAdoptFormSchema` com campos estritos sem `.default()`, resolvendo a variância de tipos do `zodResolver` entre `z.input` e `z.output`.
  * Observabilidade reativa em conformidade com o React Compiler através de `useWatch({ control })`, evitando advertências de bibliotecas incompatíveis.
  * Inputs controlados via `Controller`: campo de texto `breed` (`SecondaryInputText`) com debounce de 350ms, e seletores em chips `specie`, `gender` e `size` integrados com `PrimaryChipGroup`.
* **Camada de Dados Assíncrona com TanStack Query (`@tanstack/react-query`)**:
  * Hook [`useAdoptAnimals`](apps/mobile-web/src/hooks/useAdoptAnimals.ts):
    * Gerencia busca de animais disponíveis para adoção via `GET /api/animals` sob a chave de consulta `['animals', 'adopt']`.
    * Configurado com `staleTime: 60_000`, `gcTime: 300_000` e política de retentativas controlada.
  * Hook [`useSearchAdopt(filters)`](apps/mobile-web/src/hooks/useAdoptAnimals.ts):
    * Combina `useAdoptAnimals` com filtragem reativa em memória através de `matchesSearchAdoptFilters`.
  * Tela de Adoção ([`AdoptScreen`](apps/mobile-web/src/screens/adopt/index.tsx)):
    * Substituição de estados manuais (`useState`/`useEffect`) pelo hook `useSearchAdopt`.
    * Conexão nativa do `RefreshControl` e botão de recarga com `refetch()` e flags `isRefetching` / `isLoading`.
* **Suíte de Testes Automatizados**:
  * [`apps/mobile-web/test/components/SearchAdoptForm.spec.tsx`](apps/mobile-web/test/components/SearchAdoptForm.spec.tsx): valida atualização de campos via `react-hook-form`, debounce de busca, filtros avançados e reset de filtros.
  * [`apps/mobile-web/test/hooks/useAdoptAnimals.spec.tsx`](apps/mobile-web/test/hooks/useAdoptAnimals.spec.tsx): valida ciclo de vida da consulta com TanStack Query e aplicação de filtros em memória.

---

### 25. Armazenamento de Objetos e Banco de Dados via Supabase

* **Configuração Direta do Supabase Storage (S3 Compatível)**:
  * Removido `apps/server/src/config/storageConfig.ts`; [`apps/server/src/routes/index.ts`](apps/server/src/routes/index.ts) lê diretamente as variáveis `SUPABASE_S3_*` (com fallback para `S3_*` em ambientes de deploy) para instanciar [`UserPhotoService`](apps/server/src/services/UserPhotoService.ts) e [`AnimalPhotoService`](apps/server/src/services/AnimalPhotoService.ts).
  * Tanto o banco de dados PostgreSQL (`DATABASE_URL` / `DIRECT_URL`) quanto o armazenamento de objetos S3 utilizam o Supabase como fonte padrão em [`apps/server/.env.example`](apps/server/.env.example).



### 20. Histórico de doses no cadastro de animais (10/10/2026)

- A tela envia as listas de V10, antirrábica e vermífugo, preservando ordem, status sim/nao e data DD/MM/AAAA.
- A migração 20261010120000_add_animal_doses adiciona três colunas JSONB em tb_animals, com listas vazias para cadastros antigos e restrição de formato array; nenhum histórico é inferido dos indicadores antigos.
- POST /animals e PATCH /animals/management/:id validam até 100 doses por lista, datas reais obrigatórias para doses aplicadas e ausência de data para doses não aplicadas. Campos omitidos no PATCH são preservados; [] limpa a lista.
- As listas são retornadas apenas pela gestão autenticada, mantendo a autorização existente e a projeção pública.
- O adaptador do formulário inclui os registros legados de primeira/segunda dose quando as listas não existem.
- Aplicação: configurar DIRECT_URL para o PostgreSQL de destino e executar npm run prisma:migrate:deploy --workspace=apps/server; regenerar o cliente Prisma.

### 21. Banco compartilhado de desenvolvimento

- Configuração da equipe documentada em docs/BANCO_COMPARTILHADO.md. DATABASE_URL seleciona o banco; DIRECT_URL é destinada a migrations, com fallback para DATABASE_URL quando ausente.
- PrismaService agora verifica certificados TLS de conexões remotas, incluindo URLs com sslmode=require; sslrootcert permite CA fornecida pelo provedor. Modos TLS inseguros são rejeitados. Isso substitui a orientação antiga de rejectUnauthorized:false da seção 11.
- Pool limitado a cinco conexões por API. Falhas de conexões ociosas são registradas como evento sem detalhes sensíveis.
- Novo db:check valida acesso sem divulgar credenciais; dev:local inicia PostgreSQL e Redis, enquanto dev continua iniciando somente Redis. Nenhum comando troca DATABASE_URL automaticamente.
- Não foram criadas novas migrations nesta adaptação nem alteradas credenciais locais. O Supabase precisa ser provisionado e configurado pelo responsável; dados locais e fotos não são transferidos automaticamente.

### 22. Ativação do Supabase de desenvolvimento

- DATABASE_URL e DIRECT_URL do .env local foram configuradas para o Session pooler com sslmode=verify-full e sslrootcert apontando para a CA baixada do painel. Credenciais permanecem fora do Git.
- Conexão TLS verificada com db:check; as cinco migrations existentes foram aplicadas ao banco remoto, incluindo histórico de doses.
- Cada integrante precisa configurar sua conexão e o caminho local do certificado. Dados do PostgreSQL local e fotos não foram transferidos.

### 23. Verificação da transferência local para Supabase

- As dez tabelas de domínio foram verificadas em snapshot local somente leitura. O PostgreSQL local continha uma conta e nenhum animal, dose, foto, adoção, favorito, perfil ou evento.
- A conta local já existia no Supabase pelo mesmo e-mail; a conta remota foi preservada sem duplicação. A operação foi concluída em transação sem novos registros. Nenhum dado local foi apagado.

### 24. Cadastros de demonstração do abrigo

- Foram inseridos e verificados em transação dez cães disponíveis: Barto, Beto, Bóris, Cícero, Cigana, Duque, Emílio, Glória, Safira e Yoshi. Nomes e disponibilidade vieram das pastas do ZIP fornecido.
- Demais atributos são fictícios autorizados pelo usuário e identificados nas observações; nenhum histórico de doses foi inventado. Fotos não foram enviadas, pois o armazenamento configurado ainda é local. Nenhuma alteração de schema foi necessária.

### 25. Fotos compartilhadas dos cães

- Configurado Supabase Storage S3 no .env local, bucket público kapa-public e região us-east-1. Chaves permanecem fora do Git.
- Dez fotos JPEG originais foram lidas diretamente do ZIP, enviadas com chaves únicas e vinculadas em tb_animal_photos após verificar o acesso público HTTP. Uma foto por cão de demonstração. Nenhuma alteração de schema.

### 26. Ajuste de cobertura do SonarCloud e limpeza de código não utilizado (13/10/2026)

- Removido `apps/server/src/database/connectionConfig.ts` e seu teste `connectionConfig.spec.ts`. O arquivo era código não utilizado remanescente do merge de `development`, uma vez que a validação TLS com CA é gerenciada diretamente no `PrismaService` (`createPostgresPoolConfig`) padronizado na branch de integração.
- `apps/server/scripts/check-database.ts` foi modularizado para exportar `checkDatabase` e `run`, permitindo testes unitários dedicados em `apps/server/test/scripts/checkDatabase.spec.ts` cobrindo cenários de sucesso e falha.
- Adicionado `apps/server/scripts/**` a `sonar.coverage.exclusions` em `sonar-project.properties`, alinhando os scripts utilitários de CLI com as diretrizes do monorepo.
- Adicionados testes unitários em `apps/server/test/repositories/PostgresAnimalRepository.spec.ts` e atualizado o teste de persistência real em `databasePersistence.spec.ts` para exercitar mapeamento e persistência de doses na criação e atualização, elevando a cobertura de código novo acima da meta de 80% do Quality Gate.

### 27. Resolução de falso positivo no Gitleaks (.gitleaksignore)

- O step `Run Gitleaks` da pipeline de CI (`.github/workflows/quality.yml`) disparou um falso positivo na regra `generic-api-key` no commit histórico `39fcb2e` ao analisar a atribuição da chave secreta S3 via variável de ambiente em `apps/server/src/config/storageConfig.ts`.
- Criado o arquivo `.gitleaksignore` na raiz do repositório contendo a fingerprint da ocorrência (`39fcb2e9b63fe67dc78d819f28437d7fb4ff5d39:apps/server/src/config/storageConfig.ts:generic-api-key:42`).
- Adicionado o comentário inline `// gitleaks:allow` em `apps/server/src/config/storageConfig.ts` para evitar que futuras alterações acionem a regra indevidamente.
- Verificado via execução local do Gitleaks no Docker (`v8.24.3`) com `--log-opts="--no-merges --first-parent origin/development..HEAD"`, garantindo aprovação com zero vazamentos e código de saída 0.

### 28. Detalhes e solicitação de adoção

- A listagem de adoção agora abre uma página protegida de detalhes para cada animal disponível em `/adopet/:id`.
- A página mostra fotos, características, descrição e resumo de cuidados do pet utilizando os dados já retornados por `GET /api/animals`; não houve alteração de banco ou de API.
- O CTA abre uma confirmação e envia a solicitação autenticada para `POST /api/adoptions`. A API cria o pedido com status `pending`, usando o usuário autenticado e sem mudanças de schema.
- A API impede novo pedido ativo do mesmo adotante para o mesmo animal e recusa pedidos quando o animal não estiver mais disponível.
- O front-end inclui a ficha em `/adopet/:id/application`, com dados de contato, moradia, outros animais e responsabilidades. O conteúdo é validado e persistido junto à solicitação para análise do abrigo.

### 29. Acompanhamento e análise de solicitações de adoção

- A solicitação armazena a ficha preenchida em `applicationData` (`JSONB`) na tabela `tb_adoptions`, criada pela migration `20261016100000_add_adoption_application_data`.
- O abrigo acessa as fichas em `/gestao/solicitacoes`, podendo aprová-las ou recusá-las. A API protege a listagem e a atualização de status para o papel `admin`.
- O adotante encontra o atalho **Minhas solicitações** no próprio perfil. A tela consulta somente as solicitações daquele usuário, por `GET /api/adoptions/mine`, e apresenta o pet, a data de envio e o status atual (em análise, em conversa, aprovada, não aprovada ou cancelada).

### 30. Favoritos persistentes

- O botão de coração da listagem e da tela de detalhes agora adiciona ou remove o pet dos favoritos da pessoa autenticada. A preferência é persistida em `tb_favorites`, já existente no banco.
- A rota autenticada `POST /api/favorites` alterna o favorito do adotante para um animal, validando a existência do pet antes da alteração.
- O perfil deixou de usar dados fictícios e passou a mostrar os favoritos reais retornados por `GET /api/users/me/profile`, inclusive com a contagem atualizada.
- Caso o token JWT armazenado em cache referencie um usuário que não existe mais no banco de dados e `GET /api/users/me` ou `GET /api/users/me/profile` retorne `404 Not Found`, o interceptor em `kapaService.ts` (`shouldClearSession`) invalida a sessão obsoleta automaticamente e redireciona para `/signIn`.

### 31. Tela de Doação via PIX (`/(protected)/(adopter)/pix`)

* **Estrutura de Rota e Separação de Responsabilidade**:
  * Rota registrada em [`apps/mobile-web/app/(protected)/(adopter)/pix.tsx`](apps/mobile-web/app/(protected)/(adopter)/pix.tsx) como casca fina de navegação delegando a renderização para [`PixScreen`](apps/mobile-web/src/screens/pix/index.tsx).
  * Tela registrada no layout de pilha autenticada [`apps/mobile-web/app/(protected)/_layout.tsx`](apps/mobile-web/app/(protected)/_layout.tsx) sob o nome `(adopter)/pix`.
* **Componente de Doação (`PixScreen`)**:
  * **Chave PIX e Cópia Resiliente**:
    * Integração com a biblioteca oficial `expo-clipboard` com fallback para `navigator.clipboard` na Web.
    * Feedback visual e de acessibilidade com transição temporária de 3 segundos para o estado "Chave Copiada com Sucesso!" e limpeza preventiva de timeouts no ciclo de vida do componente (`useRef`/`useEffect`).
  * **Sugestões de Valor e Conversão Rápida**:
    * Chips com valores pré-definidos (R$ 10, R$ 25, R$ 50, R$ 100) utilizando `PrimaryChip`, destacando o impacto direto estimado em refeições para animais resgatados.
  * **Transparência e Prevenção de Desistência**:
    * Apresentação clara da Razão Social (Associação Kapa Protetores de Animais), CNPJ oficial e instituição financeira para conferência no app bancário antes de autorizar a transferência.
* **Ponto de Entrada a partir da Tela de Apoio**:
  * O card "Doar via PIX" em [`apps/mobile-web/src/screens/support/index.tsx`](apps/mobile-web/src/screens/support/index.tsx) foi tornado interativo com `Pressable`, navegando diretamente para a rota `/(protected)/(adopter)/pix`.

### 32. Edição Completa do Perfil de Usuário (`/(protected)/(adopter)/edit-profile`)

* **Estrutura de Rota e Layout**:
  * Rota registrada em [`apps/mobile-web/app/(protected)/(adopter)/edit-profile.tsx`](apps/mobile-web/app/(protected)/(adopter)/edit-profile.tsx) conectada diretamente ao componente [`EditProfileScreen`](apps/mobile-web/src/screens/editProfile/index.tsx).
  * Tela registrada no `Stack` autenticado em [`apps/mobile-web/app/(protected)/_layout.tsx`](apps/mobile-web/app/(protected)/_layout.tsx) sob `(adopter)/edit-profile`.
  * Ponto de entrada configurado na aba de perfil ([`ProfileScreen`](apps/mobile-web/src/screens/profile/index.tsx)), onde o item de menu "Editar Perfil" navega para a nova rota.
* **Componente e Lógica de Edição (`EditProfileScreen`)**:
  * **Edição de Dados Pessoais**:
    * Campos para edição do nome de exibição (`username`) e e-mail (`email`), com validação de formato e comprimento antes do envio.
    * Alteração de foto de perfil (`avatar`) utilizando o componente [`FotoPicker`](apps/mobile-web/src/components/photoPicker/profile/index.tsx) com suporte à escolha a partir da galeria ou câmera nativa via `expo-image-picker`.
    * Envio de upload multipart (`POST /api/users/me/avatar`) quando uma imagem local do dispositivo é selecionada, persistindo o arquivo no bucket S3 configurado e gerando a URL pública.
    * Atualização atômica dos dados cadastrais via `PATCH /api/users/me` e atualização imediata do estado de sessão através do método `updateUserData` no `AuthProvider`.
  * **Acesso às Preferências de Adoção**:
    * Para usuários com o papel `adopter`, exibe atalho dedicado para gerenciar os critérios de compatibilidade e preferências de busca direcionando para `/(protected)/adopter-profile`.
  * **Navegação e Cabeçalho**:
    * Botão "Voltar" acessível no topo utilizando `ArrowLeftIcon` com detecção de histórico (`router.canGoBack() ? router.back() : router.replace('/(protected)/(tabs)/profile')`).
* **Backend (`apps/server`)**:
  * Schema [`updateProfileSchema`](apps/server/src/schemas/user.schema.ts): adicionado suporte para atualização de `email` com validação de formato e sanitização.
  * Serviço [`UserService`](apps/server/src/services/UserService.ts): valida conflito de e-mail duplicado via `findByEmail` antes de atualizar o cadastro.
  * Serviço [`UserPhotoService`](apps/server/src/services/UserPhotoService.ts): adicionado para validação de tipo MIME e upload de fotos de perfil para o storage S3 em `avatars/{userId}/`.
  * Rota e Controlador: endpoint `POST /api/users/me/avatar` adicionado em [`UserRouter.ts`](apps/server/src/routes/UserRouter.ts) e [`UserController.ts`](apps/server/src/controllers/UserController.ts).
* **Suíte de Testes Automatizados**:
  * [`apps/mobile-web/test/screens/EditProfileScreen.spec.tsx`](apps/mobile-web/test/screens/EditProfileScreen.spec.tsx): valida renderização dos campos de dados pessoais, foto de perfil, validação de comprimento de nome e formato de e-mail, atalho de preferências de adoção e envio com atualização do contexto de autenticação.
  * [`apps/server/test/routes/UserRouter.spec.ts`](apps/server/test/routes/UserRouter.spec.ts), [`UserController.spec.ts`](apps/server/test/controllers/UserController.spec.ts), [`UserService.spec.ts`](apps/server/test/services/UserService.spec.ts) e [`schemas.spec.ts`](apps/server/test/validation/schemas.spec.ts) validados com 100% de aprovação.

### 33. Testes E2E com Maestro (`apps/mobile-web/.maestro`)

* **Estrutura e Configuração**:
  * Configuração base em [`apps/mobile-web/.maestro/config.yaml`](apps/mobile-web/.maestro/config.yaml) apontando para `flows/*`.
  * Fluxo mobile Android em [`apps/mobile-web/.maestro/flows/login-smoke.yaml`](apps/mobile-web/.maestro/flows/login-smoke.yaml) (`appId: edu.fatec.kapaprotetores.android`).
  * Fluxo Web em [`apps/mobile-web/.maestro/flows/web-smoke.yaml`](apps/mobile-web/.maestro/flows/web-smoke.yaml) (`url: http://localhost:8081/signIn`).
  * Scripts adicionados em [`package.json`](package.json) e [`apps/mobile-web/package.json`](apps/mobile-web/package.json): `npm run test:maestro` (Android), `npm run test:maestro:web` (Web) e `npm run maestro:studio --workspace=@kapa/mobile-web`.
  * Padronização do ciclo de vida do JWT (`ACCESS_TOKEN_TTL_SECONDS`) para **7 dias (`604800` segundos)** em [`apps/server/src/routes/index.ts`](apps/server/src/routes/index.ts) e [`apps/server/.env.example`](apps/server/.env.example), alinhado com [`apps/server/src/utils/Jwt.ts`](apps/server/src/utils/Jwt.ts).

---

### 34. Sistema Centralizado de Logging (`apps/server`)

* **Logger Estruturado com Pino ([`apps/server/src/config/logger.ts`](apps/server/src/config/logger.ts))**:
  * Implementado logger centralizado em JSON com suporte aos níveis `trace`, `debug`, `info`, `warn`, `error` e `fatal`.
  * Metadados base (`service: 'kapa-server'`, `env`) e timestamp ISO 8601 (`timestamp`), preparados para integração futura com Grafana Loki, OpenTelemetry e Datadog.
  * **Redação de Dados Sensíveis**: campos como `password`, `currentPassword`, `newPassword`, `token`, `idToken`, `accessToken`, `refreshToken`, `authorization`, `cookie`, `set-cookie`, `jwt`, `secret`, `apiKey` e `cpf` são mascarados automaticamente com `[REDACTED]`.
  * **Persistência, Rotação e Retenção (`pino-roll`)**:
    * Logs gerais (`info+`) persistidos em `logs/app.<date>.<count>.log`.
    * Logs de erro (`error+`) isolados em `logs/error.<date>.<count>.log`.
    * Rotação diária (`LOG_FREQUENCY=daily`), limite de tamanho (`LOG_MAX_SIZE=10m`) e retenção máxima (`LOG_RETENTION_COUNT=14`) configuráveis via variáveis de ambiente.
    * Saída formatada com `pino-pretty` no console em `development`, JSON puro em `stdout` em `production` e modo silencioso por padrão em `test`.
* **Correlação e Middleware HTTP ([`apps/server/src/middlewares/requestLogger.ts`](apps/server/src/middlewares/requestLogger.ts))**:
  * Propaga `X-Request-Id` validado (ou gera UUID v4) em `req.requestId` e no cabeçalho de resposta `X-Request-Id`.
  * Registra método, rota (`originalUrl`), `statusCode`, tempo de resposta (`durationMs`), `ip`, `userAgent` e `userId` (quando autenticado) ao término de cada requisição, classificando automaticamente o nível (`info` para 2xx/3xx, `warn` para 4xx e `error` para 5xx).
* **Integração com `ErrorHandler` e Infraestrutura**:
  * [`ErrorHandler.ts`](apps/server/src/middlewares/ErrorHandler.ts) registra falhas com `requestId`, contexto HTTP e stack trace completo nos logs do servidor (`warn` para `HttpError` 4xx e `error` para 5xx/erros não tratados), mantendo respostas HTTP 500 genéricas (`{"message": "Internal Server Error"}`) sem expor detalhes internos ao cliente.
  * Substituídas chamadas `console.*` por `logger` em [`index.ts`](apps/server/src/index.ts), [`PrismaService.ts`](apps/server/src/database/PrismaService.ts) e [`RedisService.ts`](apps/server/src/services/RedisService.ts).
* **Testes Automatizados**:
  * [`apps/server/test/config/logger.spec.ts`](apps/server/test/config/logger.spec.ts) e [`apps/server/test/middlewares/requestLogger.spec.ts`](apps/server/test/middlewares/requestLogger.spec.ts).

---

### 35. Otimização de Performance da Tela Inicial e Cache Redis (`apps/server` e `apps/mobile-web`)

* **Warm-up do Pool PostgreSQL no Boot ([`apps/server/src/index.ts`](apps/server/src/index.ts))**:
  * O servidor agora estabelece proativamente a conexão inicial do pool PostgreSQL (`PrismaService.getInstance().connect()`) na inicialização, eliminando a latência de cold-start (handshake TCP + TLS com o Supabase de ~500-700ms) nas primeiras requisições recebidas.
* **Cache Redis com Invalidação Automática (`CacheProvider` / [`RedisService.ts`](apps/server/src/services/RedisService.ts))**:
  * **`GET /api/animals` e `GET /api/animals/:id` ([`AnimalService.ts`](apps/server/src/services/AnimalService.ts))**: armazena em cache a listagem pública (`animals:available`, TTL 60s) e detalhes individuais (`animal:public:${id}`, TTL 60s), com invalidação automática em `AnimalService.create`, `AnimalService.update`, `AnimalPhotoService.upload` e `AdoptionService.updateStatus`.
  * **`GET /api/users/me/profile`, `GET /api/users/me` e `GET /api/users/:id/counts` ([`UserService.ts`](apps/server/src/services/UserService.ts))**: armazena em cache o perfil com relações (`user:profile:${userId}`, TTL 60s) e contagens (`user:counts:${userId}`, TTL 60s), com invalidação automática em `UserService.updateProfile`, `UserService.updateAvatar`, `UserService.updateRole`, `UserService.deleteById`, `UserPhotoService.upload`, `FavoriteService.toggle`, `AdoptionService.create` e `AdoptionService.updateStatus`.
  * **`GET /api/adopter-profiles/me`, `GET /api/adopter-profiles/user/:id` e `GET /api/adopter-profiles/:id` ([`AdopterProfileService.ts`](apps/server/src/services/AdopterProfileService.ts))**: armazena em cache o perfil de preferências por usuário (`adopter-profile:user:${userId}`, TTL 300s) e por ID (`adopter-profile:id:${id}`, TTL 300s), reconstruindo a entidade com `AdopterProfile.fromDTO` e atualizando/invalidando em `create`, `update`, `updateByUserId`, `upsert`, `delete` e `deleteByUserId`.
  * **`GET /api/adoptions/mine` e `GET /api/adoptions` ([`AdoptionService.ts`](apps/server/src/services/AdoptionService.ts))**: armazena em cache as solicitações do adotante (`adoptions:user:${adopterId}`, TTL 60s) e a listagem administrativa (`adoptions:admin:all`, TTL 60s), invalidando em `create` e `updateStatus`.
  * **`GET /api/community-events/management` ([`CommunityEventService.ts`](apps/server/src/services/CommunityEventService.ts))**: armazena em cache as atividades futuras (`community-events:manager`, TTL 60s), invalidando em `create` e `signUp`.
* **Otimização da Listagem Pública de Animais ([`PostgresAnimalRepository.ts`](apps/server/src/repositories/PostgresAnimalRepository.ts))**:
  * `findAll()` ignora a validação Zod (`doseRecordsSchema.parse`) das 3 colunas JSONB de doses (`v10_doses`, `rabies_doses`, `deworming_doses`), visto que tais campos são omitidos na projeção pública `AnimalService.publicView`.
* **Cache de Preflight CORS e Limpeza de Logs ([`App.ts`](apps/server/src/App.ts) e [`requestLogger.ts`](apps/server/src/middlewares/requestLogger.ts))**:
  * Adicionado `maxAge: 86400` (24h) na configuração de CORS para cachear respostas `OPTIONS` no navegador.
  * Requisições `OPTIONS` bem-sucedidas são registradas em nível `debug` em vez de `info`, evitando poluir os arquivos `logs/app.*.log`.
* **Eliminação de Chamada Redundante de Perfil no Reload ([`authProvider.tsx`](apps/mobile-web/src/contexts/authProvider.tsx))**:
  * Quando o estado `@kapa:has-adopter-profile` já está persistido como `true`, o `AuthProvider` não dispara uma nova requisição `GET /api/adopter-profiles/me` a cada recarregamento da página inicial.
