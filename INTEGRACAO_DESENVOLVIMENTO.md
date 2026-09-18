# Integração da branch `feature/cadastros-ong`

Este documento descreve as alterações feitas durante a integração das branches `development` e `main`, a conexão das telas com a API e o ambiente local executado com Docker.

> Estado atual importante: a página `/cadastro-animal` pode ser aberta sem login, conforme decisão temporária do projeto. Entretanto, a API ainda protege `POST /api/animals` e `POST /api/animals/:id/photos` com JWT. Portanto, enquanto o login não estiver funcional no cliente, uma chamada de cadastro sem token receberá HTTP `401`. A autorização do servidor não foi removida por segurança.

## Resumo das alterações

### Integração Git

- A branch `development` foi incorporada à `feature/cadastros-ong`.
- Depois, a versão mais recente de `main` também foi incorporada.
- As alterações locais descritas aqui ainda precisam ser revisadas e commitadas pela equipe.

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
- O utilitário antigo de criptografia insegura e a rota antiga duplicada de animais foram removidos.

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

### Qualidade e testes

- Foram adicionados testes de hashing de senha, JWT e assinatura de imagens.
- O script de testes do servidor compila o TypeScript antes de executar os testes.
- A configuração compartilhada do ESLint para Expo foi ajustada para resolver corretamente os imports do monorepo.
- Foram executados com sucesso:
  - build TypeScript do servidor;
  - typecheck do aplicativo;
  - lint do servidor e do aplicativo;
  - build web com 22 rotas;
  - cinco testes automatizados;
  - teste real de cadastro com e sem foto, persistência no PostgreSQL, armazenamento no MinIO e download HTTP da imagem.

## Como o Docker está organizado

O arquivo Compose inicia somente a infraestrutura. A API Node e o Expo continuam sendo executados no computador do desenvolvedor.

| Serviço | Container | Porta | Função |
| --- | --- | --- | --- |
| PostgreSQL | `kapa-database` | `5432` | Dados relacionais da aplicação |
| Redis | `kapa-redis` | `6379` | Cache e infraestrutura futura |
| MinIO API | `kapa-storage` | `9000` | API S3 usada pelo backend |
| MinIO Console | `kapa-storage` | `9001` | Interface administrativa local |
| Inicializador | `storage-init` | nenhuma | Cria e configura o bucket; encerra depois |

O serviço `storage-init` aparecer como `Exited (0)` é normal: ele executa uma tarefa única e termina com sucesso.

### Credenciais exclusivamente locais

| Serviço | Usuário | Senha/banco |
| --- | --- | --- |
| PostgreSQL | `docker` | senha `docker`, banco `kapa` |
| Redis | — | senha `kapa` |
| MinIO | `kapa` | senha `kapa-local-storage-secret` |

Esses valores são apenas para desenvolvimento local. Não devem ser reutilizados em homologação ou produção.

## Primeira configuração para os colegas

Pré-requisitos:

- Docker Desktop em execução;
- Node.js 20 ou superior;
- npm 10 ou superior.

Na raiz do repositório:

```bash
npm install
```

Crie o arquivo local de ambiente. No PowerShell:

```powershell
Copy-Item apps/server/.env.example apps/server/.env
```

No Linux, macOS ou Git Bash:

```bash
cp apps/server/.env.example apps/server/.env
```

Troque `JWT_SECRET` no arquivo `apps/server/.env` por um valor local aleatório com pelo menos 32 caracteres. O arquivo `.env` não deve ser commitado.

Inicie a infraestrutura a partir da raiz:

```bash
docker compose -f apps/server/docker-compose.yaml up -d
```

Confira o estado:

```bash
docker compose -f apps/server/docker-compose.yaml ps -a
```

Aplique as migrations que já existem no projeto:

```bash
cd apps/server
npx prisma migrate deploy
cd ../..
```

Esse comando aplica migrations existentes. Não use `prisma migrate dev` para inventar ou alterar o schema sem aprovação da equipe.

Inicie API e Expo juntos:

```bash
npm run dev
```

Ou separadamente, em dois terminais:

```bash
npm run dev:server
```

```bash
npm run dev:mobile
```

Endereços locais:

- API: `http://localhost:4000`
- Health check: `http://localhost:4000/api/health`
- Expo Web normalmente: `http://localhost:8081`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

## Uso diário do Docker

Subir os serviços já criados:

```bash
docker compose -f apps/server/docker-compose.yaml up -d
```

Ver status, incluindo o inicializador encerrado:

```bash
docker compose -f apps/server/docker-compose.yaml ps -a
```

Ver logs de todos os serviços:

```bash
docker compose -f apps/server/docker-compose.yaml logs -f
```

Ver logs de apenas um serviço:

```bash
docker compose -f apps/server/docker-compose.yaml logs -f database
docker compose -f apps/server/docker-compose.yaml logs -f redis
docker compose -f apps/server/docker-compose.yaml logs -f storage
```

Parar os containers preservando os dados:

```bash
docker compose -f apps/server/docker-compose.yaml down
```

Reiniciar um serviço específico:

```bash
docker compose -f apps/server/docker-compose.yaml restart database
```

### Apagar todo o ambiente local

O comando abaixo remove containers **e todos os volumes**, apagando banco, cache e imagens locais. Use somente quando a perda desses dados for intencional:

```bash
docker compose -f apps/server/docker-compose.yaml down -v
```

Depois será necessário executar novamente `up -d` e `prisma migrate deploy`.

## Verificações úteis

Testar a saúde da API no PowerShell:

```powershell
Invoke-RestMethod http://localhost:4000/api/health
```

Abrir uma sessão SQL dentro do PostgreSQL:

```bash
docker exec -it kapa-database psql -U docker -d kapa
```

Alguns comandos úteis dentro do `psql`:

```sql
\dt
SELECT count(*) FROM tb_users;
SELECT count(*) FROM tb_animals;
SELECT count(*) FROM tb_animal_photos;
\q
```

No Console do MinIO (`http://localhost:9001`), use as credenciais locais da tabela acima e abra o bucket `kapa-public` para inspecionar as imagens.

## Variáveis de ambiente relevantes

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão Prisma/PostgreSQL |
| `JWT_SECRET` | Assinatura dos tokens; deve ter pelo menos 32 caracteres |
| `JWT_ISSUER` | Emissor esperado do JWT |
| `JWT_AUDIENCE` | Audiência esperada do JWT |
| `ACCESS_TOKEN_TTL_SECONDS` | Duração do access token |
| `REDIS_PASSWORD` | Senha do Redis local |
| `S3_ENDPOINT` | Endpoint S3 acessado pelo backend |
| `S3_PUBLIC_URL` | Base pública usada nas URLs salvas no banco |
| `S3_REGION` | Região informada ao cliente S3 |
| `S3_BUCKET` | Bucket de fotos |
| `S3_ACCESS_KEY` | Usuário do MinIO/S3 |
| `S3_SECRET_KEY` | Senha do MinIO/S3 |

Em emulador Android, o aplicativo usa `http://10.0.2.2:4000/api`. No navegador e iOS Simulator, usa `http://localhost:4000/api`. Para testar em um celular físico na mesma rede, configure `EXPO_PUBLIC_API_URL` com o IP local do computador, por exemplo:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.10:4000/api
```

Também será necessário garantir que firewall, CORS e rede local permitam a conexão.

## Limitações e próximos passos

- O login no cliente ainda precisa ser concluído e validado pela equipe. Até que exista uma conta admin autenticada, a tela administrativa de usuários redirecionará para login ou acesso não autorizado.
- Como a API de criação de animais exige JWT, o cadastro pela interface não persistirá sem uma sessão válida. A página foi mantida acessível para desenvolvimento visual, mas isso não substitui a autenticação do servidor.
- O token atualmente fica somente em memória; recarregar o aplicativo encerra a sessão local.
- Ainda não existe uma tela para reenviar ou editar a foto de um animal depois de uma falha de upload.
- A listagem de animais ainda possui compatibilidade com registros legados do AsyncStorage; novos cadastros são enviados à API.
- As imagens do bucket local têm leitura pública. Em produção, a equipe deve decidir entre CDN pública controlada ou bucket privado com URLs assinadas.
- As credenciais do Compose são somente locais e precisam ser substituídas por secrets reais em outros ambientes.

## Comandos de qualidade antes de enviar alterações

```bash
npm test --workspace=@kapa/server
npm run lint
npx tsc --noEmit -p apps/mobile-web/tsconfig.json
npm run build:web --workspace=@kapa/mobile-web
```

Revise também `git diff`, confirme que nenhum `.env` foi incluído e não crie migrations sem aprovação explícita.
