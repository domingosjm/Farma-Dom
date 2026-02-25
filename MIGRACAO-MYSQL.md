# MIGRAÇÃO DE SUPABASE PARA MYSQL

## Resumo das Alterações

Este documento descreve as alterações feitas para migrar o sistema FarmaDom de Supabase para MySQL.

## 1. Backend

### 1.1 Dependências Atualizadas

**Arquivo:** `backend/requirements.txt`

- ❌ Removido: `supabase==2.3.4`, `psycopg2-binary==2.9.9`
- ✅ Adicionado: `pymysql==1.1.0`, `cryptography==41.0.7`

### 1.2 Configuração do Banco de Dados

**Arquivo:** `backend/app/core/config.py`

- Removidas variáveis de ambiente do Supabase
- Adicionadas configurações para MySQL:
  - `MYSQL_HOST` - Host do servidor MySQL (padrão: localhost)
  - `MYSQL_PORT` - Porta do MySQL (padrão: 3306)
  - `MYSQL_USER` - Usuário do banco
  - `MYSQL_PASSWORD` - Senha do usuário
  - `MYSQL_DATABASE` - Nome do banco de dados (padrão: farmadom)
  - `DATABASE_URL` - URL de conexão gerada automaticamente

### 1.3 Modelos

**Arquivo:** `backend/app/models/usuario.py`

- Alterado tipo de ID de `UUID` PostgreSQL para `String(36)` MySQL
- Ajustados tipos de dados para compatibilidade com MySQL
- Atualizados nomes de colunas (`ativo` → `is_ativo`, `verificado` → `email_verificado`)

### 1.4 Schema do Banco de Dados

**Arquivo:** `database/mysql_schema.sql`

- Criado schema completo para MySQL
- Todas as tabelas adaptadas para sintaxe MySQL:
  - Uso de `CHAR(36)` para UUIDs
  - `ENUM` para tipos enumerados
  - `JSON` para dados estruturados
  - `TIMESTAMP` com `ON UPDATE CURRENT_TIMESTAMP`
- Inclusos dados iniciais (seed data) para medicamentos e pacotes

## 2. Frontend

### 2.1 Dependências Atualizadas

**Arquivo:** `frontend/package.json`

- ❌ Removido: `@supabase/supabase-js`
- A comunicação será feita diretamente com a API REST do backend

### 2.2 Cliente API

**Arquivo:** `frontend/src/lib/apiClient.ts`

- Novo cliente HTTP para comunicação com a API backend
- Suporta autenticação via Bearer token
- Métodos: GET, POST, PUT, DELETE
- Gerenciamento automático de tokens no localStorage

### 2.3 Arquivos a Atualizar

Os seguintes arquivos precisam ser refatorados para usar o novo `apiClient`:

- `frontend/src/services/authService.ts` - Serviço de autenticação
- `frontend/src/services/dashboardService.ts` - Serviço do dashboard
- `frontend/src/services/medicamentosService.ts` - Serviço de medicamentos
- `frontend/src/services/consultasService.ts` - Serviço de consultas
- `frontend/src/services/pacotesService.ts` - Serviço de pacotes
- `frontend/src/services/pedidosService.ts` - Serviço de pedidos
- `frontend/src/services/adminService.ts` - Serviço administrativo
- `frontend/src/stores/authStore.ts` - Store de autenticação

## 3. Configuração do Ambiente

### 3.1 Backend

Criar arquivo `.env` baseado em `.env.example`:

```bash
cd backend
cp .env.example .env
# Editar .env com suas configurações
```

Variáveis importantes:
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
- `SECRET_KEY` - Chave secreta para JWT (mínimo 32 caracteres)

### 3.2 Frontend

Criar arquivo `.env` baseado em `.env.example`:

```bash
cd frontend
cp .env.example .env
# Editar .env com suas configurações
```

Variável importante:
- `VITE_API_URL` - URL da API backend (padrão: http://localhost:8000/api/v1)

## 4. Setup do MySQL

### 4.1 Instalação

**Windows:**
```bash
# Baixar e instalar MySQL Community Server
# https://dev.mysql.com/downloads/mysql/
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

### 4.2 Criar Banco de Dados e Usuário

```sql
-- Conectar como root
mysql -u root -p

-- Criar banco de dados
CREATE DATABASE farmadom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar usuário
CREATE USER 'farmadom_user'@'localhost' IDENTIFIED BY 'sua_senha_aqui';

-- Conceder permissões
GRANT ALL PRIVILEGES ON farmadom.* TO 'farmadom_user'@'localhost';
FLUSH PRIVILEGES;

-- Sair
EXIT;
```

### 4.3 Importar Schema

```bash
mysql -u farmadom_user -p farmadom < database/mysql_schema.sql
```

## 5. Instalação de Dependências

### 5.1 Backend

```bash
cd backend
pip install -r requirements.txt
```

### 5.2 Frontend

```bash
cd frontend
npm install
```

## 6. Executar o Sistema

### 6.1 Backend

```bash
cd backend
python main.py
# Ou
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 6.2 Frontend

```bash
cd frontend
npm run dev
```

## 7. Diferenças Principais

### Supabase vs MySQL

| Aspecto | Supabase | MySQL |
|---------|----------|-------|
| **Autenticação** | Built-in (Supabase Auth) | Implementada via FastAPI + JWT |
| **RLS** | Row Level Security nativo | Implementado na camada da aplicação |
| **Real-time** | WebSockets nativos | Precisa implementar separadamente |
| **Storage** | Storage API nativo | Implementar com sistema de arquivos ou S3 |
| **Client** | SDK JavaScript | API REST padrão |
| **Tipos** | PostgreSQL | MySQL |

### Vantagens do MySQL

- ✅ Mais controle sobre o banco de dados
- ✅ Menor dependência de serviços externos
- ✅ Melhor para ambientes on-premise
- ✅ Custo reduzido em produção
- ✅ Amplamente suportado em Angola

### Considerações

- ⚠️ Autenticação agora gerenciada pelo backend
- ⚠️ Não há Real-time automático
- ⚠️ Storage de arquivos precisa ser implementado
- ⚠️ Necessário gerenciar o servidor MySQL

## 8. Próximos Passos

1. ✅ Configurar MySQL localmente
2. ✅ Importar schema
3. ✅ Configurar variáveis de ambiente
4. ⚠️ Refatorar serviços do frontend para usar API REST
5. ⚠️ Testar todas as funcionalidades
6. ⚠️ Implementar upload de arquivos (fotos de perfil, etc)
7. ⚠️ Configurar backup do MySQL
8. ⚠️ Preparar ambiente de produção

## 9. Troubleshooting

### Erro de conexão MySQL

```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql  # Linux
# Ou através do MySQL Workbench no Windows

# Testar conexão
mysql -u farmadom_user -p -h localhost farmadom
```

### Erro de autenticação

- Verificar se `SECRET_KEY` está configurado no `.env`
- Verificar se o token está sendo enviado no header
- Verificar logs do backend

### Erro de CORS

- Verificar se a URL do frontend está em `CORS_ORIGINS` no backend
- Por padrão: `http://localhost:5173` e `http://localhost:3000`

## 10. Suporte

Para dúvidas ou problemas:
1. Verificar os logs do backend
2. Verificar o console do navegador
3. Consultar a documentação da API em: http://localhost:8000/docs
