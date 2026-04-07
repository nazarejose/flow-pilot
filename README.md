# Flow Pilot

Sistema de gerenciamento de chamados (helpdesk) com autententicacao baseada em roles.

## Stack

- **Backend**: NestJS + TypeORM + PostgreSQL
- **Frontend**: Vue 3 + Vite + PrimeVue + Pinia + Vue Router

---

## Como rodar o projeto

### Pre-requisitos

- Node.js >= 18
- Docker e Docker Compose instalados (para o banco de dados)

### 1. Subir o banco (Docker)

```bash
docker-compose up -d
```

Isso sobe um PostgreSQL 16 na porta `5432` com as credenciais configuradas no `backend/.env`.

Para parar o banco:

```bash
docker-compose down
```

### 2. Backend

```bash
cd backend
npm install
npm run start:dev
```

O servidor sobe em `http://localhost:3000`.

### 2. Frontend

Abra um **segundo terminal**:

```bash
cd frontend
npm install
npm run dev
```

A aplicacao abre em `http://localhost:5173`.

---

## Contas de acesso

| Role         | E-mail                    | Senha  |
| ------------ | ------------------------- | ------ |
| **Admin**    | admin@raposo.com          | 123456 |
| **Atendente**| atendente@raposo.com      | 123456 |
| **Solicitante**| solicitante@raposo.com  | 123456 |

### Permissoes por role

#### Admin

- Acesso total ao sistema
- Gerencia usuarios, helpdesks, setores e todos os chamados
- Cria, edita, responde e encerra qualquer chamado

#### Atendente

- Visualiza chamados atribuidos ao seu helpdesk
- Responde e altera o status dos chamados (atendimento)
- **Nao pode** criar novos chamados

#### Solicitante

- Cria novos chamados
- Visualiza e acompanha seus proprios chamados
- Adiciona comentarios e mencoes nos chamados que criou
