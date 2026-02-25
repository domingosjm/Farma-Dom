# 💬 Sistema de Chat em Tempo Real

## ✅ Implementação Completa

Sistema de chat em tempo real usando Socket.IO para comunicação durante consultas médicas.

## 🏗️ Arquitetura

### Backend
- **Socket.IO Server** (`backend/src/config/socket.ts`)
  - Autenticação via JWT
  - Salas por consulta
  - Eventos em tempo real
  - Armazenamento de mensagens

### Frontend
- **Chat Service** (`frontend/src/services/chatService.ts`)
  - Gerenciamento de conexões
  - Emissão e escuta de eventos
  
- **Componente Chat** (`frontend/src/components/ChatConsulta.tsx`)
  - Interface moderna de chat
  - Indicador de digitação
  - Confirmação de leitura (check duplo)
  - Scroll automático
  - Agrupamento por data

### Banco de Dados
- **Tabela mensagens_chat**: Armazena todas as mensagens
- **Tabela usuarios_online**: Rastreia quem está conectado
- **Campo chat_ativo**: Indica se consulta tem chat ativo

## 📋 Instalação

### 1. Execute o SQL
```sql
-- Execute o arquivo: database/create_chat_tables.sql
-- no MySQL Workbench ou phpMyAdmin
```

### 2. Dependências já instaladas
```bash
# Backend
socket.io, cors

# Frontend
socket.io-client
```

## 🚀 Como Usar

### Para Pacientes e Médicos:

1. **Acesse a página de Consultas** (`/consultas`)

2. **Clique em uma consulta** com status:
   - Confirmada
   - Em Andamento

3. **Clique em "Abrir Chat"**
   - Modal de chat abre em tela cheia
   - Conecta automaticamente via WebSocket
   - Carrega histórico de mensagens

4. **Funcionalidades:**
   - ✉️ Enviar mensagens (Enter ou botão)
   - 👁️ Ver indicador de digitação
   - ✓✓ Confirmação de leitura
   - 📅 Mensagens agrupadas por data
   - 🕒 Horário de cada mensagem
   - 📱 Interface responsiva

## 🎯 Recursos Implementados

### ✅ Comunicação em Tempo Real
- Mensagens instantâneas
- Sem necessidade de atualizar página
- Notificações de entrada/saída de usuários

### ✅ Indicadores Visuais
- **Digitando...**: Mostra quando outra pessoa está digitando
- **Check simples (✓)**: Mensagem enviada
- **Check duplo (✓✓)**: Mensagem lida
- **Status online/offline**

### ✅ Experiência do Usuário
- Scroll automático para novas mensagens
- Agrupamento inteligente por data
- Design moderno com gradientes
- Avatares coloridos
- Formato de bolhas de chat

### ✅ Segurança
- Autenticação via JWT
- Verificação de permissões
- Usuário só acessa chats de suas consultas

## 🔧 Estrutura de Eventos Socket.IO

### Cliente → Servidor
- `join_consulta`: Entrar na sala da consulta
- `send_message`: Enviar mensagem
- `typing`: Notificar digitação
- `marcar_lidas`: Marcar mensagens como lidas
- `leave_consulta`: Sair da sala

### Servidor → Cliente
- `historico_mensagens`: Histórico ao entrar
- `nova_mensagem`: Nova mensagem recebida
- `usuario_entrou`: Outro usuário entrou
- `usuario_saiu`: Outro usuário saiu
- `usuario_digitando`: Alguém está digitando
- `mensagens_lidas`: Mensagens foram lidas
- `error`: Erro na operação

## 📊 Tabelas do Banco

### mensagens_chat
```sql
- id (UUID)
- consulta_id (FK)
- remetente_id (FK)
- mensagem (TEXT)
- tipo (enum: texto, arquivo, sistema)
- arquivo_url (opcional)
- arquivo_nome (opcional)
- lida (boolean)
- created_at (timestamp)
```

### usuarios_online
```sql
- usuario_id (PK, FK)
- socket_id (string)
- consulta_id (FK, nullable)
- ultima_atividade (timestamp)
```

## 🎨 Design

- **Cores:** Gradiente azul-roxo
- **Tipografia:** Font system com fallbacks
- **Animações:** Suaves e performáticas
- **Responsivo:** Mobile-first

## 🔮 Próximas Melhorias (Opcionais)

- 📎 Upload de arquivos/imagens
- 📞 Integração com videochamada
- 🔔 Notificações push
- 📝 Mensagens de sistema (ex: "Consulta iniciada")
- 🔍 Busca no histórico
- ⭐ Mensagens favoritas
- 📊 Estatísticas de chat

## ⚡ Performance

- Conexão persistente WebSocket
- Reconexão automática
- Mensagens armazenadas no banco
- Histórico carregado uma vez
- Updates incrementais

## 🐛 Troubleshooting

### Chat não conecta?
- Verifique se backend está rodando
- Confirme que Socket.IO está ativo
- Verifique token JWT válido

### Mensagens não aparecem?
- Execute o SQL `create_chat_tables.sql`
- Verifique permissões da consulta
- Veja console do navegador para erros

### Outros problemas?
- Limpe cache do navegador
- Reinicie backend
- Verifique logs do terminal

## 🎉 Status

✅ **PRONTO PARA USO**

Sistema completamente funcional e integrado!
