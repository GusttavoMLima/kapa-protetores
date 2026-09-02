# 🐾 Kapa Protetores dos Animais

> **Projeto Integrador do 5º Semestre — Curso Superior de Tecnologia em Desenvolvimento de Software Multiplataforma (DSM) | FATEC**

O **Kapa** é uma plataforma multiplataforma de resgate, proteção e facilitação de adoções desenvolvida para uma ONG de proteção animal. O sistema conecta voluntários, protetores e adotantes através de um aplicativo universal (Android, iOS e Web/PWA) integrado a uma API de gerenciamento seguro.

---

## 🏛️ Arquitetura do Monorepo

O projeto está estruturado como um **Monorepo moderno** utilizando **npm workspaces**, permitindo o compartilhamento de tipos de domínio, regras de lint e utilitários entre o cliente móvel/web e o backend.

```text
kapa-protetores/
├── apps/
│   ├── mobile-web/              # Aplicativo Universal (Expo SDK 57 + React Native Web)
│   │   ├── app/                 # Roteamento baseado em arquivos (Expo Router)
│   │   │   ├── _layout.tsx      # Layout raiz com tema e provedores
│   │   │   └── index.tsx        # Ponto de entrada / telas
│   │   ├── assets/              # Vetores SVG, logotipos e tipografias
│   │   ├── src/
│   │   │   ├── components/      # Componentes de UI (botões, inputs, chips, headers)
│   │   │   ├── screens/         # Telas da aplicação (Login, Cadastro de Animal)
│   │   │   ├── theme/           # Tokens do Design System (cores, tipografia, layout)
│   │   │   └── storage/         # Persistência local (AsyncStorage)
│   │   ├── app.json             # Configurações do Expo e Web PWA
│   │   └── package.json
│   │
│   └── server/                  # API REST Backend (Node.js + Express + TypeScript)
│       ├── src/
│       │   ├── routes/          # Definição e montagem de endpoints (health, animals)
│       │   └── index.ts         # Inicialização do servidor, CORS e middlewares
│       ├── .env.example
│       └── package.json
│
├── packages/
│   ├── shared/                  # Pacote de Domínio Compartilhado (@kapa/shared)
│   │   ├── src/
│   │   │   ├── types/           # Interfaces e tipos do modelo de negócio (Animal, Especie, etc.)
│   │   │   ├── constants/       # Opções e valores padrão do sistema
│   │   │   └── utils/           # Funções utilitárias universais (formatação de datas, etc.)
│   │   └── package.json
│   │
│   └── eslint-config/           # Configuração de Linter Compartilhada (@kapa/eslint-config)
│       ├── index.js             # Flat config base para TypeScript
│       ├── node.js              # Flat config para o backend Node.js
│       ├── expo.js              # Flat config para React Native / Expo
│       └── package.json
│
├── .vscode/                     # Configurações recomendadas para o VS Code
├── package.json                 # Orquestração e scripts raiz do Monorepo
└── README.md
```

---

## 🚀 Tecnologias

### Mobile & Web (`apps/mobile-web`)
- **React Native 0.86** + **React 19**
- **Expo SDK 57** (Universal: Android, iOS, Web/PWA)
- **Expo Router** (Navegação baseada em sistema de arquivos)
- **React Native Web** (Compilação estática atômica para navegadores)
- **Phosphor React Native** (Ícones vetoriais modernos)
- **React Hook Form** + **Zod** (Validação de formulários e schemas em runtime)
- **React Native SVG** + **react-native-svg-transformer** (Renderização vetorial)

### Backend (`apps/server`)
- **Node.js** + **TypeScript**
- **Express 4**
- **TSX** (Execução e hot-reload TypeScript ultrarrápido)
- **CORS** + **Dotenv**
- Tratamento centralizado de erros e desligamento gracioso (*graceful shutdown*)

### Pacotes & Qualidade
- **npm Workspaces** (Gerenciamento de dependências e symlinks)
- **ESLint 9 Flat Config** (Padronização e análise estática de código)
- **TypeScript 5/6 Strict Mode** (Tipagem rigorosa sem `any`)

---

## 🎨 Design System

O projeto adota o estilo **Modern Organic**, fundamentado em tons acolhedores e interfaces limpas documentadas em [`DESIGN.md`](./DESIGN.md):

| Cor | Hex | Aplicação |
| :--- | :--- | :--- |
| **Zesty Orange** | `#F18322` | Cor primária, botões de ação e destaques de marca |
| **Deep Denim** | `#2A4E75` | Cor secundária, textos de contraste e navegação |
| **Surface Cream**| `#FFFBF7` | Fundo principal da aplicação (reduz fadiga visual) |
| **Soft Peach** | `#FFE7DB` | Containers suaves, chips e tags de atributos |

---

## 🛠️ Pré-requisitos

Certifique-se de ter instalado em seu ambiente:
- **Node.js** (versão 20 LTS ou superior)
- **npm** (versão 10 ou superior)
- Para testes no celular: aplicativo **Expo Go** ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)) ou emulador configurado.

---

## 📦 Instalação e Configuração

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/GusttavoMLima/kapa-protetores.git
   cd kapa-protetores
   ```

2. **Instale as dependências de todos os workspaces**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente do backend**:
   ```bash
   cp apps/server/.env.example apps/server/.env
   ```
   *(Edite `apps/server/.env` caso deseje alterar a porta padrão `4000`)*.

4. **Compile os pacotes compartilhados**:
   ```bash
   npm run build:server
   ```

---

## 💻 Comandos e Scripts

Executados a partir da raiz do monorepo:

### Desenvolvimento Simultâneo (Recomendado)
Inicia o servidor Express e o bundler do Expo em paralelo:
```bash
npm run dev
```

### Execução Individual
```bash
# Iniciar apenas o backend Express (com hot-reload)
npm run dev:server

# Iniciar apenas o aplicativo Expo
npm run dev:mobile

# Abrir diretamente no navegador Web
npm run web

# Abrir no emulador Android
npm run android

# Abrir no simulador iOS (macOS)
npm run ios
```

### Qualidade e Build
```bash
# Executar a verificação de linter em todos os workspaces
npm run lint

# Compilar o backend para produção
npm run build:server

# Exportar a versão Web/PWA estática
npm run build:web
```

---

## 🌐 Endpoints da API

Com o servidor rodando em `http://localhost:4000`:

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/` | Confirmação de status da API |
| `GET` | `/api/health` | Health check com tempo de atividade (*uptime*) |
| `GET` | `/api/animals` | Listagem dos animais resgatados |
| `POST` | `/api/animals` | Cadastro de um novo animal |

---

## 🤝 Contribuição e Padrões de Código

Conforme estabelecido nas [Diretrizes de Desenvolvimento (`AGENTS.md`)](./AGENTS.md):
- **Segurança em Primeiro Lugar**: Todas as entradas externas devem ser validadas; nunca versione segredos ou credenciais.
- **Tipagem Estrita**: Evite o uso de `any`; reutilize os tipos centralizados em `@kapa/shared`.
- **Acessibilidade**: Mantenha tamanhos de toque mínimos (48px+), rótulos acessíveis e bom contraste visual.
- **Linting Obrigatório**: Todo commit deve passar com 0 erros no comando `npm run lint`.

---

## 👥 Colaboradores

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/DaniloAlvesantos" title="Github Danilo Alves">
        <img src="https://avatars.githubusercontent.com/u/72460852?v=4" width="100px;" alt="Foto Danilo"/><br>
        <sub>
          <b>Danilo Alves</b>
        </sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/GusttavoMLima" title="Github Gustavao Marques">
        <img src="https://avatars.githubusercontent.com/u/179064501?v=4" width="100px;" alt="Foto Gustavo"/><br>
        <sub>
          <b>Gustavo Marques</b>
        </sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/juliasbarbosa" title="Github Julia Barbosa">
        <img src="https://avatars.githubusercontent.com/u/167313658?v=4" width="100px;" alt="Foto Julia"/><br>
        <sub>
          <b>Julia Barbosa</b>
        </sub>
      </a>
    </td>
     <td align="center">
      <a href="https://github.com/AmabileSilverio" title="Github Amábile Silvério">
        <img src="https://avatars.githubusercontent.com/u/179064545?v=4" width="100px;" alt="Foto Amábile"/><br>
        <sub>
          <b>Amábile Silvério</b>
        </sub>
      </a>
    </td>
  </tr>
</table>

---
## 📄 Licença

Distribuído sob a licença **MIT**. Consulte o arquivo [`LICENSE`](./LICENSE) para mais detalhes.
