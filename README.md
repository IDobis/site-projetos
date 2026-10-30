# Projetos

Site pessoal para guardar projetos. Monorepo com API NestJS e frontend Next.js.

## Requisitos

- Node.js 22.13 ou superior
- npm 10

## Instalar

Na raiz do repositório:

```bash
npm install
```

## Rodar

Os dois apps juntos:

```bash
npm run dev
```

Ou em terminais separados:

```bash
npm run dev -w api
npm run dev -w web
```

- Web: http://localhost:3000
- API: http://localhost:3001/api

O frontend usa `NEXT_PUBLIC_API_URL`. Se a variável não existir, o padrão é `http://localhost:3001/api`.

A API grava os projetos em SQLite local (`apps/api/data/projects.sqlite`). Não há login nem deploy.

## Qualidade

Na raiz:

```bash
npm run format
npm run lint
npm run build
npm run test
```

Cada app também expõe `lint`, `build` e `test`.
