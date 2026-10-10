# Banco de desenvolvimento compartilhado

Todos os backends locais podem usar o mesmo PostgreSQL no Supabase. Um cadastro feito pela API de um integrante fica disponível para os demais. Use apenas dados fictícios e um projeto separado de produção.

## Configuração inicial pelo responsável

1. Crie um projeto Supabase para desenvolvimento. No painel Connect, copie a URI do Session pooler na porta 5432 (compatível com IPv4). Não use o Transaction pooler para migrations.
2. Configure `apps/server/.env`, ignorado pelo Git. Substitua `DATABASE_URL` pela URI real, com `sslmode=verify-full`. Codifique caracteres especiais da senha para URL. Se a conexão precisar de CA própria, baixe o certificado no painel e acrescente `sslrootcert=C%3A%2Fcertificados%2Fsupabase-ca.crt` usando seu caminho real. Não desative a verificação TLS.
3. Configure `DIRECT_URL` com a URI direta ou do Session pooler, também com TLS verificado, para o usuário responsável pelas migrations. Quando omitida, a CLI usa `DATABASE_URL`; esse fallback é útil para o banco local. Usuários sem permissão de migrations não devem executar os comandos de alteração do banco.
4. Execute a partir da raiz:

```sh
npm run prisma:generate --workspace=apps/server
npm run db:check --workspace=apps/server
npm run prisma:migrate:deploy --workspace=apps/server
```

O deploy aplica todas as migrations pendentes. Centralize essa execução no responsável ou no pipeline. Não execute `prisma migrate dev`, `db push` ou resets no banco compartilhado.

Para criar a primeira conta administrativa, configure `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` apenas no ambiente do responsável e execute `npm run prisma:seed`. O seed atual cria/atualiza apenas essa conta: não copie as credenciais administrativas para todos os integrantes. Cadastre animais fictícios pela aplicação e crie contas individuais pela gestão de usuários.

## Configuração de cada integrante

Receba a conexão do ambiente de desenvolvimento por canal privado. Configure `DATABASE_URL` no `.env` local. Prefira usuários de banco com permissões apenas para as operações necessárias da API; reserve permissões de alteração do schema ao responsável. Mantenha JWT e configurações locais da API no backend, sem credenciais PostgreSQL no aplicativo Expo.

```sh
npm run db:check --workspace=apps/server
npm run dev:server
```

`dev:server` inicia Redis local e a API, usando o banco definido no `.env`. O pool de cada API usa no máximo cinco conexões. Para usar PostgreSQL local, configure a URL local no `.env` e execute `npm run dev:local --workspace=apps/server`. Esse comando inicia PostgreSQL e Redis; não troca a URL automaticamente.

Compartilhar o banco não copia os dados que já estão em cada computador. Para começar, cadastre um conjunto de animais fictícios no banco remoto uma única vez. A transferência de dados locais existentes exige selecionar e exportar esses dados separadamente.

## Fotos, testes e operação

Configure armazenamento S3 compartilhado para que as fotos sejam acessíveis a todos. URLs `localhost:9000` apontam para o computador de quem as acessa; não atendem ao compartilhamento. O banco remoto funciona sem fotos enquanto esse armazenamento é configurado.

Os testes de persistência continuam em PostgreSQL descartável via Testcontainers. Não conecte testes destrutivos ao banco compartilhado. Faça backup antes de mudanças e lembre que uma edição ou exclusão no ambiente compartilhado afeta toda a equipe.

Referências: [conexões Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres), [TLS do node-postgres](https://node-postgres.com/features/ssl).
