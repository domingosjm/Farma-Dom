# Migração para MySQL Remoto - FarmaDom

## ✅ Configuração Completa

As credenciais do banco de dados MySQL remoto foram configuradas com sucesso no sistema FarmaDom.

## 📋 Informações do Servidor

- **Host:** 192.185.131.80
- **Porta:** 3306
- **Usuário:** ononam25_domingos
- **Banco de Dados:** ononam25_fdom
- **Senha:** (configurada no arquivo .env)

## 🔧 Arquivos Atualizados

### 1. Backend Environment (`.env`)
```env
MYSQL_HOST=192.185.131.80
MYSQL_PORT=3306
MYSQL_USER=ononam25_domingos
MYSQL_PASSWORD=<sua_senha>
MYSQL_DATABASE=ononam25_fdom
NODE_ENV=production
```

### 2. Documentação
- ✅ `DATABASE-CREDENTIALS.md` - Credenciais completas e instruções
- ✅ `.gitignore` atualizado para proteger credenciais
- ✅ Script de importação `import-schema-remote.bat`

## 🚀 Próximos Passos

### 1. Importar o Schema no Banco Remoto

**Opção A: Usando o script automatizado (Windows)**
```bash
import-schema-remote.bat
```
Quando solicitado, digite a senha configurada no `.env`

**Opção B: Manualmente via MySQL Client**
```bash
mysql -h 192.185.131.80 -P 3306 -u ononam25_domingos -p ononam25_fdom < database\mysql_schema_complete.sql
```

**Opção C: Via phpMyAdmin**
1. Acesse o phpMyAdmin do servidor (se disponível)
2. Faça login com as credenciais
3. Selecione o banco de dados `ononam25_fdom`
4. Vá em "Importar"
5. Selecione o arquivo `database/mysql_schema_complete.sql`
6. Execute a importação

### 2. Testar a Conexão

Inicie o backend para verificar a conexão:

```bash
cd backend
npm install
npm run dev
```

Você deverá ver uma mensagem como:
```
✅ Conectado ao MySQL Remoto
   Database: ononam25_fdom
   User: ononam25_domingos@192.185.131.80
   Version: [versão do MySQL]
```

### 3. Verificar as Tabelas

Após importar o schema, você pode verificar se todas as tabelas foram criadas:

```sql
USE ononam25_fdom;
SHOW TABLES;
```

Deverá listar 26 tabelas:
- usuarios
- farmacias
- hospitais
- empresas_transporte
- profissionais_saude
- consultas
- consultas_signals
- mensagens_chat
- usuarios_online
- medicamentos
- pacotes_saude
- assinaturas_pacotes
- pagamentos_assinaturas
- pedidos
- itens_pedido
- farmacia_estoque
- fila_rodizio
- rodizio_config
- receitas_digitais
- itens_receita
- veiculos
- entregas
- rastreamento_pedidos
- avaliacoes_consultas
- logs_auditoria
- comissoes_config

## 🔐 Segurança

### Arquivos Protegidos no .gitignore:
- `backend/.env` - Variáveis de ambiente
- `DATABASE-CREDENTIALS.md` - Documentação de credenciais

### ⚠️ IMPORTANTE:
- **Nunca** faça commit do arquivo `.env` no Git
- Mantenha as credenciais seguras
- Sempre use HTTPS/SSL em produção
- Configure firewall do banco de dados para IPs permitidos
- Faça backups regulares do banco de dados

## 🌐 Acesso Remoto

### Conectar ao MySQL via Cliente
```bash
mysql -h 192.185.131.80 -P 3306 -u ononam25_domingos -p
```

### Configurar Acesso de IP (se necessário)
Certifique-se de que seu IP está permitido no firewall do servidor. Entre em contato com o administrador do servidor se tiver problemas de conexão.

## 📊 Dados de Teste

O schema inclui dados de teste:
- 1 Usuário Admin: `admin@farmadom.ao` / `admin123`
- 10 Usuários de teste (vários perfis)
- 2 Farmácias
- 1 Hospital
- 1 Empresa de Transporte
- 15 Medicamentos
- 4 Pacotes de Saúde

## 🐛 Troubleshooting

### ⚠️ Erro: "Access denied for user '@SEU_IP' (using password: YES)"

**Este é o erro mais comum!**

**Causa:** O servidor MySQL está bloqueando conexões do seu IP.

**Solução:** Você precisa liberar seu IP no servidor. Veja o arquivo [MYSQL-ACCESS-ERROR-FIX.md](MYSQL-ACCESS-ERROR-FIX.md) para instruções detalhadas.

**Ações rápidas:**
1. Descubra seu IP: https://whatismyipaddress.com/
2. Acesse o cPanel do hosting
3. Vá em "Remote MySQL" ou "MySQL Remoto"
4. Adicione seu IP atual à lista permitida
5. Salve e tente conectar novamente

### Erro: "Access denied"
- Verifique se as credenciais no `.env` estão corretas
- Confirme o nome do banco de dados: `ononam25_fdom`

### Erro: "Can't connect to MySQL server"
- Verifique se o host está correto: `192.185.131.80`
- Verifique se a porta 3306 está acessível
- Verifique sua conexão de internet
- Confirme se o firewall está permitindo a conexão

### Erro: "Unknown database"
- O banco de dados pode não ter sido criado
- Entre em contato com o administrador do servidor
- O schema SQL criará o banco automaticamente se tiver permissões

## 📞 Suporte

Para problemas ou dúvidas sobre a configuração do banco de dados remoto, entre em contato com o administrador do sistema.

---

**Data de Configuração:** 25 de fevereiro de 2026
**Versão do Schema:** 2.0
**Status:** ✅ Configurado e pronto para uso
