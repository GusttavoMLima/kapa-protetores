# Integração e Guia de Desenvolvimento — Kapa Protetores

Este documento consolida a arquitetura de autenticação (**Google OAuth** e **E-mail/Senha**), persistência de sessão, integração entre React Native/Expo e a API Express, infraestrutura local com Docker e procedimentos para resolução de problemas e garantia de qualidade.

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
| `CLIENT_URL` | Backend | URL do cliente autorizada no CORS (padrão: `http://localhost:8081`) |
| `GOOGLE_CLIENT_ID` | Backend | Client ID principal da aplicação Google |
| `GOOGLE_WEB_CLIENT_ID` | Backend | Client ID web para verificação de audiência |
| `GOOGLE_IOS_CLIENT_ID` | Backend | Client ID iOS para verificação de audiência |
| `GOOGLE_ANDROID_CLIENT_ID` | Backend | Client ID Android para verificação de audiência |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Mobile/Web | Client ID Google injetado no navegador pelo Expo |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Mobile/Web | Client ID nativo para dispositivos iOS |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Mobile/Web | Client ID nativo para dispositivos Android |
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

> **Aviso de Governança (`AGENTS.md`):** Nunca execute alterações diretas no esquema do banco de dados (`schema.prisma`) ou crie migrações sem alinhamento e autorização prévia da equipe.