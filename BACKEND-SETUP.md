# 🚀 Setup e Execução do Backend - Chat e Videochamadas

## 📋 Pré-requisitos

- Node.js 18+ instalado
- MySQL 8.0+ instalado e rodando
- Banco de dados criado (farmadom)

## 🔧 Configuração do Banco de Dados

### 1. Execute o script de setup das tabelas

```bash
# No MySQL Workbench ou linha de comando MySQL:
mysql -u root -p farmadom < database/setup_chat_video.sql
```

Ou execute o arquivo SQL manualmente:
- Abra o arquivo `database/setup_chat_video.sql`
- Execute no seu cliente MySQL

Isso irá criar:
- ✅ Tabela `mensagens_chat` - Para armazenar mensagens do chat
- ✅ Tabela `usuarios_online` - Para rastrear usuários online
- ✅ Tabela `consultas_signals` - Para sinais WebRTC
- ✅ Colunas adicionais na tabela `consultas`

### 2. Verificar estrutura

```sql
SHOW TABLES LIKE '%chat%';
SHOW TABLES LIKE '%signal%';
SHOW TABLES LIKE '%online%';
```

## 📦 Instalação das Dependências

```bash
cd backend
npm install
```

## ⚙️ Variáveis de Ambiente

Crie ou verifique o arquivo `.env` no diretório `backend`:

```env
# Servidor
PORT=8000
NODE_ENV=development

# Banco de Dados
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=farmadom

# JWT
JWT_SECRET=sua_chave_secreta_muito_segura_aqui

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:3001
```

## 🏃 Executar o Backend

### Modo Desenvolvimento (com hot reload)

```bash
cd backend
npm run dev
```

### Modo Produção

```bash
cd backend
npm run build
npm start
```

## ✅ Verificar se está Funcionando

Após iniciar o servidor, você deve ver:

```
===================================
  🚀 FarmaDom Backend API
===================================
  📍 URL: http://localhost:8000
  📚 Docs: http://localhost:8000/api/docs
  🌍 Environment: development
===================================
✅ Socket.IO configurado com sucesso
✅ Database connection successful
```

### Testar endpoints:

1. **Health check**: http://localhost:8000/health
2. **Root**: http://localhost:8000/

## 🔌 Endpoints Implementados

### Chat e Comunicação

#### Socket.IO Events (WebSocket)

```javascript
// Conectar ao Socket.IO
socket = io('http://localhost:8000', {
  auth: { token: 'seu_jwt_token' }
});

// Entrar em uma consulta
socket.emit('join_consulta', { consultaId: 'id_da_consulta' });

// Enviar mensagem
socket.emit('send_message', {
  consultaId: 'id_da_consulta',
  mensagem: 'Olá, doutor!'
});

// Indicar que está digitando
socket.emit('typing', {
  consultaId: 'id_da_consulta',
  isTyping: true
});

// Marcar mensagens como lidas
socket.emit('marcar_lidas', { consultaId: 'id_da_consulta' });

// Sair da consulta
socket.emit('leave_consulta', { consultaId: 'id_da_consulta' });
```

#### Receber eventos do servidor:

```javascript
// Histórico de mensagens ao entrar
socket.on('historico_mensagens', (mensagens) => {
  console.log('Mensagens:', mensagens);
});

// Nova mensagem recebida
socket.on('nova_mensagem', (mensagem) => {
  console.log('Nova mensagem:', mensagem);
});

// Usuário entrou na sala
socket.on('usuario_entrou', (data) => {
  console.log('Usuário entrou:', data);
});

// Usuário saiu da sala
socket.on('usuario_saiu', (data) => {
  console.log('Usuário saiu:', data);
});

// Usuário está digitando
socket.on('usuario_digitando', (data) => {
  console.log('Digitando:', data);
});

// Erros
socket.on('error', (error) => {
  console.error('Erro:', error);
});
```

### REST API Endpoints

#### Consultas

```
GET    /api/v1/consultas                    - Listar consultas do usuário
GET    /api/v1/consultas/:id                - Buscar consulta específica
POST   /api/v1/consultas                    - Criar nova consulta
PUT    /api/v1/consultas/:id/cancelar       - Cancelar consulta
PUT    /api/v1/consultas/:id/iniciar        - Iniciar consulta
PUT    /api/v1/consultas/:id/finalizar      - Finalizar consulta

GET    /api/v1/consultas/horarios-disponiveis  - Horários disponíveis
```

#### WebRTC (Videochamadas)

```
POST   /api/v1/consultas/:id/signal         - Enviar sinal WebRTC
GET    /api/v1/consultas/:id/signal         - Receber sinais WebRTC
```

#### Médico

```
GET    /api/v1/medico/stats                 - Estatísticas do médico
GET    /api/v1/medico/consultas-hoje        - Consultas de hoje
GET    /api/v1/medico/consultas             - Todas as consultas
PUT    /api/v1/medico/consultas/:id/iniciar - Iniciar consulta (médico)
PUT    /api/v1/medico/consultas/:id/concluir - Concluir consulta
GET    /api/v1/medico/pacientes             - Listar pacientes
GET    /api/v1/medico/pacientes/:id/historico - Histórico do paciente
GET    /api/v1/medico/perfil                - Perfil profissional
PUT    /api/v1/medico/disponibilidade       - Atualizar disponibilidade
```

## 🐛 Troubleshooting

### Erro de conexão com Socket.IO

- Verifique se o CORS está configurado corretamente
- Certifique-se de que o token JWT está sendo enviado
- Verifique os logs do servidor

### Mensagens não aparecem

- Verifique se as tabelas foram criadas corretamente
- Confirme que o usuário está na sala da consulta
- Verifique os logs do console

### Videochamada não conecta

- Verifique se os sinais WebRTC estão sendo salvos
- Confirme que ambos os usuários têm acesso à consulta
- Verifique as permissões de câmera e microfone no navegador

## 📝 Logs Úteis

O backend mostra logs detalhados:

```
✅ Usuário conectado: user_id (email)
✅ Usuário user_id entrou na consulta consulta_id
📨 Mensagem enviada na consulta consulta_id
👋 Usuário user_id saiu da consulta consulta_id
❌ Usuário desconectado: user_id
```

## 🧪 Testar com Postman ou cURL

### Obter token JWT (Login):

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "medico@example.com",
    "senha": "senha123"
  }'
```

### Listar consultas:

```bash
curl http://localhost:8000/api/v1/consultas \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### Iniciar consulta:

```bash
curl -X PUT http://localhost:8000/api/v1/medico/consultas/CONSULTA_ID/iniciar \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

## 🎉 Pronto!

O backend está configurado e pronto para suportar:
- ✅ Chat em tempo real com Socket.IO
- ✅ Videochamadas com WebRTC
- ✅ Gestão completa de consultas
- ✅ Indicadores de digitação
- ✅ Mensagens lidas/não lidas
- ✅ Rastreamento de usuários online

Agora você pode executar o frontend e testar todas as funcionalidades!
