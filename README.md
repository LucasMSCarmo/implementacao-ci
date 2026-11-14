# API de Tarefas — CI com GitHub Actions

API REST de tarefas (CRUD) em **Node.js + TypeScript + Express**, com banco de dados **PostgreSQL**,
usada para demonstrar um workflow de **Integração Contínua** com GitHub Actions.

## Endpoints

| Método | Rota         | Descrição                               |
| ------ | ------------ | --------------------------------------- |
| GET    | `/health`    | Status da API e da conexão com o banco  |
| GET    | `/tasks`     | Lista tarefas (`?done=true\|false`)     |
| GET    | `/tasks/:id` | Busca uma tarefa                        |
| POST   | `/tasks`     | Cria (`title`, `description?`, `done?`) |
| PATCH  | `/tasks/:id` | Altera campos de uma tarefa             |
| DELETE | `/tasks/:id` | Remove uma tarefa                       |

## Executar localmente

```bash
docker compose up --build
curl -X POST localhost:3000/tasks -H 'Content-Type: application/json' -d '{"title":"Estudar CI"}'
curl localhost:3000/tasks
```

## Pipeline de CI (`.github/workflows/ci.yml`)

Disparado em **Pull Requests** para `main`/`develop`. Os jobs rodam em sequência (`needs`),
do mais barato para o mais caro (_fail fast_):

1. **Formatação e análise estática** — Prettier, ESLint (+ `eslint-plugin-security`), `tsc --noEmit`
2. **Análise estática de segurança** — `npm audit` e CodeQL (SAST)
3. **Testes unitários** — Vitest + Supertest com repositório em memória, cobertura mínima de 80%
4. **Build** — compila TypeScript para `dist/` e publica como artefato
5. **Testes de integração** — sobe o `dist/` contra um PostgreSQL real (container de serviço)
6. **Criação de imagem** — Docker Buildx, teste de fumaça, scan com Trivy e push para o GHCR

## Scripts

```bash
npm run format:check   # formatação
npm run lint           # análise estática
npm run typecheck      # tipos
npm run test:unit      # testes unitários + cobertura
npm run build          # build
DATABASE_URL=postgres://app:app@localhost:5432/app_test npm run test:integration
```
