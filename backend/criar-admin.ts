import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

async function criarAdmin() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'farmadom',
    });

    console.log('✅ Conectado ao MySQL');

    // Dados do admin
    const adminData = {
      id: randomUUID(),
      nome_completo: 'Administrador',
      email: 'admin@farmadom.ao',
      senha: 'admin123', // Altere depois do primeiro login!
      tipo_usuario: 'admin'
    };

    // Hash da senha
    const senhaHash = await bcrypt.hash(adminData.senha, 10);

    // Verificar se admin já existe
    const [existing]: any = await connection.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [adminData.email]
    );

    if (existing.length > 0) {
      console.log('⚠️  Usuário admin já existe!');
      console.log('📧 Email:', adminData.email);
      await connection.end();
      return;
    }

    // Inserir admin
    await connection.execute(
      `INSERT INTO usuarios (id, nome_completo, email, senha_hash, tipo_usuario, is_ativo)
       VALUES (?, ?, ?, ?, ?, true)`,
      [adminData.id, adminData.nome_completo, adminData.email, senhaHash, adminData.tipo_usuario]
    );

    console.log('✅ Usuário admin criado com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Senha:', adminData.senha);
    console.log('👤 Tipo:', adminData.tipo_usuario);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');

    await connection.end();
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

criarAdmin();
