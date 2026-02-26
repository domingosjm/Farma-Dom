# 🏥 FarmaDom - Sistema de Saúde Domiciliar

Sistema completo de saúde domiciliar para Angola, incluindo consultas online, farmácia, entregas e gestão hospitalar.

## 🚨 IMPORTANTE: Configuração do Banco de Dados

### ❌ Erro Atual: Access Denied

Se você está vendo este erro:
```
Access denied for user 'ononam25_domingos'@'SEU_IP' (using password: YES)
```

**Ação Necessária:** Seu IP precisa ser liberado no servidor MySQL remoto.

📖 **Soluções detalhadas:** [MYSQL-ACCESS-ERROR-FIX.md](MYSQL-ACCESS-ERROR-FIX.md)

### 🔧 Diagnóstico Rápido

Execute o script de diagnóstico:
```bash
test-mysql-connection.bat
```

Este script irá:
- ✅ Mostrar seu IP público
- ✅ Testar ping para o servidor
- ✅ Verificar se a porta 3306 está acessível
- ✅ Tentar conexão MySQL

### ✅ Liberar Acesso (cPanel)

1. Acesse o **cPanel** do seu hosting
2. Procure por "**Remote MySQL**" ou "**MySQL Remoto**"
3. Adicione seu IP atual (você pode ver executando o script acima)
4. Salve as configurações
5. Execute novamente: `start-backend.bat`

## 📋 Configuração do Servidor

### Credenciais MySQL Remoto

- **Host:** `192.185.131.80`
- **Porta:** `3306`
- **Usuário:** `ononam25_domingos`
- **Database:** `ononam25_fdom`
- **Senha:** (configurada no `.env`)

📖 **Documentação completa:** [MYSQL-REMOTO-SETUP.md](MYSQL-REMOTO-SETUP.md)

## 🚀 Início Rápido

### 1. Verificar Configuração

```bash
# Ver seu IP e status da conexão
test-mysql-connection.bat
```

### 2. Importar Schema (após liberar IP)

```bash
# Importar todas as tabelas e dados iniciais
import-schema-remote.bat
```

### 3. Iniciar Backend

```bash
# Instalar dependências e iniciar servidor
start-backend.bat
```

### 4. Iniciar Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📁 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `test-mysql-connection.bat` | Diagnosticar problemas de conexão |
| `import-schema-remote.bat` | Importar schema no banco remoto |
| `start-backend.bat` | Iniciar servidor backend |

## 📚 Documentação

- 📘 [MYSQL-REMOTO-SETUP.md](MYSQL-REMOTO-SETUP.md) - Configuração completa do MySQL
- 🔧 [MYSQL-ACCESS-ERROR-FIX.md](MYSQL-ACCESS-ERROR-FIX.md) - Solução para erros de acesso
- 📋 [DATABASE-CREDENTIALS.md](DATABASE-CREDENTIALS.md) - Credenciais e conexão
- 💾 [BACKEND-SETUP.md](BACKEND-SETUP.md) - Configuração do backend
- 💬 [CHAT-README.md](CHAT-README.md) - Sistema de chat e vídeo

## 🏗️ Estrutura do Projeto

```
farma-dom/
├── backend/              # API Node.js + Express + MySQL
│   ├── src/
│   │   ├── config/      # Configurações
│   │   ├── routes/      # Rotas da API
│   │   ├── middleware/  # Middleware
│   │   └── index.ts     # Entry point
│   └── .env             # Variáveis de ambiente
├── frontend/            # React + TypeScript + Vite
│   └── src/
│       ├── components/  # Componentes React
│       ├── pages/       # Páginas
│       ├── services/    # API services
│       └── stores/      # Estado global
└── database/            # Scripts SQL
    └── mysql_schema_complete.sql
```

## 🔐 Segurança

- ✅ Credenciais protegidas no `.env` (não commitado)
- ✅ JWT para autenticação
- ✅ Validação de dados com Zod
- ✅ Proteção contra SQL Injection
- ✅ CORS configurado

## 🐛 Troubleshooting

### Erro: "Access denied"
👉 Veja [MYSQL-ACCESS-ERROR-FIX.md](MYSQL-ACCESS-ERROR-FIX.md)

### Erro: "Can't connect to MySQL server"
- Verifique sua conexão com internet
- Execute `test-mysql-connection.bat` para diagnóstico
- Confirme se o firewall não está bloqueando

### Erro: "Unknown database"
- Execute `import-schema-remote.bat` para criar as tabelas
- Verifique se o banco de dados existe no servidor

### Backend não inicia
```bash
cd backend
npm install
npm run dev
```

### Frontend não carrega
```bash
cd frontend
npm install
npm run dev
```

## 📦 Tecnologias

### Backend
- Node.js + Express
- TypeScript
- MySQL 2
- Socket.IO (chat/vídeo)
- JWT (autenticação)
- Bcrypt (senhas)

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Socket.IO Client
- WebRTC (chamadas de vídeo)

## 👥 Tipos de Usuários

- 👤 **Paciente** - Agendar consultas, comprar medicamentos
- 👨‍⚕️ **Médico** - Atender consultas, prescrever receitas
- 👩‍⚕️ **Enfermeiro** - Atendimento domiciliar
- 💊 **Farmácia** - Gerenciar estoque, pedidos
- 🏥 **Hospital** - Gestão de profissionais
- 🚗 **Transporte** - Entregas
- 👑 **Admin** - Gestão completa do sistema

## 📊 Funcionalidades

### Para Pacientes
- ✅ Consultas online (vídeo/chat)
- ✅ Compra de medicamentos
- ✅ Assinaturas de saúde
- ✅ Histórico médico
- ✅ Rastreamento de pedidos

### Para Médicos
- ✅ Atendimento online
- ✅ Prescrição digital
- ✅ Gestão de consultas
- ✅ Chat com pacientes

### Para Farmácias
- ✅ Gestão de estoque
- ✅ Recebimento de pedidos (rodízio)
- ✅ Controle de entregas

### Para Admin
- ✅ Gestão de usuários
- ✅ Aprovação de entidades
- ✅ Relatórios
- ✅ Configurações do sistema

## 📞 Suporte

Para problemas técnicos ou dúvidas:
1. Consulte a documentação específica
2. Execute os scripts de diagnóstico
3. Entre em contato com o administrador do sistema

---

**Status:** 🚧 Em configuração  
**Próximo Passo:** Liberar acesso MySQL remoto  
**Versão:** 2.0  
**Data:** Fevereiro 2026
