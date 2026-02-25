const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const medicos = [
  {
    nome_completo: 'Dr. João Santos',
    email: 'medico@farmadom.ao',
    telefone: '+244912345678',
    especialidade: 'Clínico Geral',
    numero_ordem: 'OM12345',
    anos_experiencia: 10,
    valor_consulta_online: 5000,
    valor_consulta_domicilio: 10000
  },
  {
    nome_completo: 'Dra. Maria Costa',
    email: 'maria.costa@farmadom.ao',
    telefone: '+244912345679',
    especialidade: 'Pediatria',
    numero_ordem: 'OM12346',
    anos_experiencia: 8,
    valor_consulta_online: 6000,
    valor_consulta_domicilio: 12000
  },
  {
    nome_completo: 'Dr. Pedro Almeida',
    email: 'pedro.almeida@farmadom.ao',
    telefone: '+244912345680',
    especialidade: 'Cardiologia',
    numero_ordem: 'OM12347',
    anos_experiencia: 12,
    valor_consulta_online: 8000,
    valor_consulta_domicilio: 15000
  },
  {
    nome_completo: 'Dra. Ana Silva',
    email: 'ana.silva@farmadom.ao',
    telefone: '+244912345681',
    especialidade: 'Ginecologia',
    numero_ordem: 'OM12348',
    anos_experiencia: 7,
    valor_consulta_online: 7000,
    valor_consulta_domicilio: 14000
  }
];

async function createMedicos() {
  let connection;

  try {
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'farmadom'
    });

    console.log('✅ Conectado ao banco de dados');

    // Hash da senha
    const password = 'medico123';
    const senhaHash = await bcrypt.hash(password, 10);
    console.log('✅ Senha hash gerada');

    // Criar médicos
    for (const medico of medicos) {
      try {
        // Verificar se já existe
        const [existing] = await connection.execute(
          'SELECT id FROM usuarios WHERE email = ?',
          [medico.email]
        );

        if (existing.length > 0) {
          console.log(`❌ Médico ${medico.email} já existe`);
          continue;
        }

        // Inserir usuário
        const [result] = await connection.execute(
          `INSERT INTO usuarios (
            nome_completo, email, senha_hash, telefone, tipo_usuario, is_ativo
          ) VALUES (?, ?, ?, ?, 'medico', TRUE)`,
          [
            medico.nome_completo,
            medico.email,
            senhaHash,
            medico.telefone
          ]
        );

        const usuarioId = result.insertId;
        console.log(`✅ Usuário criado: ${medico.nome_completo} (ID: ${usuarioId})`);

        // Inserir dados profissionais (sem usar especialidade_id)
        await connection.execute(
          `INSERT INTO profissionais_saude (
            usuario_id, numero_ordem, especialidade, anos_experiencia,
            atende_domicilio, atende_online, 
            valor_consulta_online, valor_consulta_domicilio,
            disponivel
          ) VALUES (?, ?, ?, ?, TRUE, TRUE, ?, ?, TRUE)`,
          [
            usuarioId,
            medico.numero_ordem,
            medico.especialidade,
            medico.anos_experiencia,
            medico.valor_consulta_online,
            medico.valor_consulta_domicilio
          ]
        );

        console.log(`✅ Perfil profissional criado para ${medico.nome_completo}`);
        console.log('---');

      } catch (error) {
        console.error(`❌ Erro ao criar ${medico.email}:`, error.message);
      }
    }

    console.log('\n✅ Processo concluído!');
    console.log('📧 Login: medico@farmadom.ao');
    console.log('🔑 Senha: medico123');

  } catch (error) {
    console.error('Erro ao criar médicos:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createMedicos();
