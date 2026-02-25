# FarmaDom — Configuração Supabase

## 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project**
3. Escolha uma organização (ou crie uma)
4. Preencha:
   - **Name**: `farmadom`
   - **Database Password**: (guarde esta senha!)
   - **Region**: Escolha o mais próximo (ex: `eu-west-1` para Europa/África)
5. Clique em **Create new project** e aguarde ~2 minutos

## 2. Obter Credenciais

No painel do Supabase, vá em **Settings → API**:

| Campo | Onde usar | Variável |
|-------|----------|----------|
| **Project URL** | Frontend + Backend | `SUPABASE_URL` / `VITE_SUPABASE_URL` |
| **anon public** | Frontend | `VITE_SUPABASE_ANON_KEY` |
| **service_role** | Backend (NUNCA expor no frontend!) | `SUPABASE_SERVICE_ROLE_KEY` |

Para a connection string, vá em **Settings → Database → Connection string → URI**:
- Substitua `[YOUR-PASSWORD]` pela senha do passo 1
- Use a porta **6543** (Transaction mode — melhor para APIs)

## 3. Executar a Migration

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **New query**
3. Copie e cole todo o conteúdo de `database/supabase_migration.sql`
4. Clique em **Run** (▶️)
5. Verifique que todas as tabelas foram criadas em **Table Editor**

> **Nota**: A migration cria 22 tabelas, indices, triggers, RLS policies e dados iniciais (medicamentos + pacotes de saúde).

## 4. Configurar Variáveis de Ambiente

### Backend (`backend/.env`)

```env
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
JWT_SECRET=uma-chave-secreta-forte-de-pelo-menos-32-caracteres
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## 5. Iniciar o Projeto

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (nova janela)
cd frontend
npm install
npm run dev
```

## Arquitectura

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Frontend    │────→│  Backend API │────→│  Supabase        │
│  React/Vite  │     │  Express/TS  │     │  PostgreSQL      │
│              │     │              │     │  + Storage       │
│  supabase-js │     │  pg Pool     │     │  + Realtime      │
│  (realtime)  │     │  supabase-js │     │  + Edge Functions│
└─────────────┘     └──────────────┘     └──────────────────┘
```

- **Backend** usa `pg` Pool para SQL queries (conecta ao Supabase PostgreSQL)
- **Backend** usa `@supabase/supabase-js` com `service_role` para Storage e features admin
- **Frontend** usa `@supabase/supabase-js` com `anon` key para Realtime subscriptions
- **Todas as queries SQL** existentes funcionam sem alteração (Supabase É PostgreSQL)

## Row Level Security (RLS)

RLS está habilitado em todas as tabelas. Como o backend usa a `service_role` key, ele tem bypass automático de RLS. As policies criadas apenas permitem leitura pública de `medicamentos` e `pacotes_saude`.

Se no futuro quiser que o frontend acesse dados diretamente via Supabase (sem passar pelo backend), adicione RLS policies específicas.

## Supabase Storage (Opcional)

Para uploads de imagens (foto_perfil, foto_comprovante):

1. No Dashboard, vá em **Storage**
2. Crie buckets: `avatars`, `comprovantes`, `receitas`
3. Configure policies de acesso
4. Use `supabase.storage.from('bucket').upload(...)` no backend
