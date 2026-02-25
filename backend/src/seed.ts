import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/farmadom';

async function seed() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log('🌱 Iniciando seed de dados...');
    await client.query('BEGIN');

    const hash = await bcrypt.hash('123456', 10);

    // ============= ADMIN =============
    const adminId = crypto.randomUUID();
    await client.query(
      `INSERT INTO usuarios (id, nome_completo, email, senha_hash, telefone, tipo_usuario, status_conta)
       VALUES ($1, 'Administrador FarmaDom', 'admin@farmadom.ao', $2, '+244900000001', 'admin', 'aprovada')
       ON CONFLICT (email) DO NOTHING`,
      [adminId, hash]
    );
    console.log('✅ Admin criado: admin@farmadom.ao / 123456');

    // ============= HOSPITAIS =============
    const hospital1Id = crypto.randomUUID();
    const hospital2Id = crypto.randomUUID();

    await client.query(
      `INSERT INTO hospitais (id, nome, endereco, cidade, provincia, telefone, email, tipo, especialidades, latitude, longitude)
       VALUES 
         ($1, 'Hospital Geral de Luanda', 'Rua Major Kanhangulo, Ingombota', 'Luanda', 'Luanda', '+244222123456', 'contato@hgl.ao', 'publico', $3, -8.8383, 13.2344),
         ($2, 'Clínica Sagrada Esperança', 'Rua Comandante Gika, Alvalade', 'Luanda', 'Luanda', '+244222654321', 'contato@cse.ao', 'privado', $4, -8.8147, 13.2302)
       ON CONFLICT DO NOTHING`,
      [hospital1Id, hospital2Id,
       JSON.stringify(['clinica_geral', 'pediatria', 'cardiologia', 'ortopedia']),
       JSON.stringify(['clinica_geral', 'dermatologia', 'oftalmologia', 'ginecologia'])]
    );

    // Gerente hospital 1
    const gerenteH1Id = crypto.randomUUID();
    await client.query(
      `INSERT INTO usuarios (id, nome_completo, email, senha_hash, telefone, tipo_usuario, status_conta, entidade_id, entidade_tipo)
       VALUES ($1, 'Carlos Mendes', 'gerente@hgl.ao', $2, '+244900000010', 'hospital_gerente', 'aprovada', $3, 'hospital')
       ON CONFLICT (email) DO NOTHING`,
      [gerenteH1Id, hash, hospital1Id]
    );
    console.log('✅ Hospitais criados (2)');

    // ============= FARMACIAS =============
    const farm1Id = crypto.randomUUID();
    const farm2Id = crypto.randomUUID();
    const farm3Id = crypto.randomUUID();

    await client.query(
      `INSERT INTO farmacias (id, nome, endereco, cidade, provincia, zona, telefone, email, nif, alvara, latitude, longitude, is_online, horario_abertura, horario_fechamento)
       VALUES 
         ($1, 'Farmácia Central', 'Av. 4 de Fevereiro 120, Ingombota', 'Luanda', 'Luanda', 'zona_a', '+244222111111', 'central@farmadom.ao', '5417896321', 'ALV-001', -8.8368, 13.2330, true, '08:00', '20:00'),
         ($2, 'Farmácia Saúde+', 'Rua da Missão 45, Maianga', 'Luanda', 'Luanda', 'zona_b', '+244222222222', 'saude@farmadom.ao', '5417896322', 'ALV-002', -8.8390, 13.2280, true, '07:00', '22:00'),
         ($3, 'Farmácia Vida Nova', 'Av. Deolinda Rodrigues 300, Sambizanga', 'Luanda', 'Luanda', 'zona_a', '+244222333333', 'vidanova@farmadom.ao', '5417896323', 'ALV-003', -8.8200, 13.2400, true, '08:00', '19:00')
       ON CONFLICT DO NOTHING`,
      [farm1Id, farm2Id, farm3Id]
    );

    // Farmacia admins
    const farmAdmin1Id = crypto.randomUUID();
    const farmAdmin2Id = crypto.randomUUID();
    const farmAdmin3Id = crypto.randomUUID();

    await client.query(
      `INSERT INTO usuarios (id, nome_completo, email, senha_hash, telefone, tipo_usuario, status_conta, entidade_id, entidade_tipo)
       VALUES 
         ($1, 'Ana Silva', 'admin@central.ao', $4, '+244900000020', 'farmacia_admin', 'aprovada', $5, 'farmacia'),
         ($2, 'Bruno Costa', 'admin@saude.ao', $4, '+244900000021', 'farmacia_admin', 'aprovada', $6, 'farmacia'),
         ($3, 'Carla Neto', 'admin@vidanova.ao', $4, '+244900000022', 'farmacia_admin', 'aprovada', $7, 'farmacia')
       ON CONFLICT (email) DO NOTHING`,
      [farmAdmin1Id, farmAdmin2Id, farmAdmin3Id, hash, farm1Id, farm2Id, farm3Id]
    );
    console.log('✅ Farmácias criadas (3)');

    // ============= EMPRESA DE TRANSPORTE =============
    const transporteId = crypto.randomUUID();
    await client.query(
      `INSERT INTO empresas_transporte (id, nome, telefone, email, cidade, provincia, numero_veiculos, zonas_cobertura)
       VALUES ($1, 'TransFarma Express', '+244900000040', 'contato@transfex.ao', 'Luanda', 'Luanda', 5, $2)
       ON CONFLICT DO NOTHING`,
      [transporteId, JSON.stringify(['zona_a', 'zona_b', 'zona_c'])]
    );

    const gerenteTransId = crypto.randomUUID();
    await client.query(
      `INSERT INTO usuarios (id, nome_completo, email, senha_hash, telefone, tipo_usuario, status_conta, entidade_id, entidade_tipo)
       VALUES ($1, 'Manuel Santos', 'gerente@transfex.ao', $2, '+244900000041', 'transporte_gerente', 'aprovada', $3, 'empresa_transporte')
       ON CONFLICT (email) DO NOTHING`,
      [gerenteTransId, hash, transporteId]
    );

    // Motoristas
    const motorista1Id = crypto.randomUUID();
    const motorista2Id = crypto.randomUUID();
    await client.query(
      `INSERT INTO usuarios (id, nome_completo, email, senha_hash, telefone, tipo_usuario, status_conta, entidade_id, entidade_tipo)
       VALUES 
         ($1, 'José Ferreira', 'jose@transfex.ao', $3, '+244900000050', 'motorista', 'aprovada', $4, 'empresa_transporte'),
         ($2, 'Pedro Miguel', 'pedro@transfex.ao', $3, '+244900000051', 'motorista', 'aprovada', $4, 'empresa_transporte')
       ON CONFLICT (email) DO NOTHING`,
      [motorista1Id, motorista2Id, hash, transporteId]
    );

    // Veículos
    await client.query(
      `INSERT INTO veiculos (id, empresa_id, motorista_id, placa, modelo, tipo, capacidade)
       VALUES 
         ($1, $3, $5, 'LD-00-01-AB', 'Honda PCX 150', 'moto', 'pequena'),
         ($2, $3, $6, 'LD-00-02-CD', 'Toyota Hiace', 'van', 'grande')
       ON CONFLICT DO NOTHING`,
      [crypto.randomUUID(), crypto.randomUUID(), transporteId, transporteId, motorista1Id, motorista2Id]
    );
    console.log('✅ Empresa de transporte criada com 2 motoristas e veículos');

    // ============= MÉDICOS =============
    const medicos = [
      { nome: 'Dr. António Luís', email: 'antonio@farmadom.ao', tel: '+244900000030', esp: 'clinica_geral', ordem: 'OM-12345' },
      { nome: 'Dra. Maria Fernandes', email: 'maria@farmadom.ao', tel: '+244900000031', esp: 'pediatria', ordem: 'OM-12346' },
      { nome: 'Dr. João Baptista', email: 'joao@farmadom.ao', tel: '+244900000032', esp: 'cardiologia', ordem: 'OM-12347' },
      { nome: 'Dra. Sofia Tavares', email: 'sofia@farmadom.ao', tel: '+244900000033', esp: 'dermatologia', ordem: 'OM-12348' },
      { nome: 'Dr. Ricardo Almeida', email: 'ricardo@farmadom.ao', tel: '+244900000034', esp: 'ortopedia', ordem: 'OM-12349' },
    ];

    for (const med of medicos) {
      const medicoUserId = crypto.randomUUID();
      await client.query(
        `INSERT INTO usuarios (id, nome_completo, email, senha_hash, telefone, tipo_usuario, status_conta)
         VALUES ($1, $2, $3, $4, $5, 'medico', 'aprovada')
         ON CONFLICT (email) DO NOTHING`,
        [medicoUserId, med.nome, med.email, hash, med.tel]
      );

      await client.query(
        `INSERT INTO profissionais_saude (id, usuario_id, numero_ordem, especialidade, anos_experiencia, atende_online, disponivel, valor_consulta_online)
         VALUES ($1, $2, $3, $4, $5, true, true, $6)
         ON CONFLICT DO NOTHING`,
        [crypto.randomUUID(), medicoUserId, med.ordem, med.esp, Math.floor(Math.random() * 15) + 3, 5000 + Math.floor(Math.random() * 10000)]
      );

      // Link to hospitals
      await client.query(
        `INSERT INTO medicos_hospitais (id, medico_id, hospital_id, ativo) VALUES ($1, $2, $3, true) ON CONFLICT DO NOTHING`,
        [crypto.randomUUID(), medicoUserId, hospital1Id]
      );
    }
    console.log('✅ Médicos criados (5)');

    // ============= PACIENTES =============
    const paciente1Id = crypto.randomUUID();
    const paciente2Id = crypto.randomUUID();

    await client.query(
      `INSERT INTO usuarios (id, nome_completo, email, senha_hash, telefone, tipo_usuario, status_conta, cidade, provincia)
       VALUES 
         ($1, 'Maria Joaquina', 'paciente@farmadom.ao', $3, '+244900000060', 'paciente', 'aprovada', 'Luanda', 'Luanda'),
         ($2, 'Alberto Santos', 'alberto@farmadom.ao', $3, '+244900000061', 'paciente', 'aprovada', 'Luanda', 'Luanda')
       ON CONFLICT (email) DO NOTHING`,
      [paciente1Id, paciente2Id, hash]
    );
    console.log('✅ Pacientes criados (2)');

    // ============= MEDICAMENTOS =============
    const medicamentos = [
      { nome: 'Paracetamol 500mg', desc: 'Analgésico e antipirético', preco: 350, cat: 'analgesicos', req: false, est: 500 },
      { nome: 'Ibuprofeno 400mg', desc: 'Anti-inflamatório não esteroide', preco: 500, cat: 'anti_inflamatorios', req: false, est: 300 },
      { nome: 'Amoxicilina 500mg', desc: 'Antibiótico de largo espectro', preco: 1200, cat: 'antibioticos', req: true, est: 200 },
      { nome: 'Omeprazol 20mg', desc: 'Inibidor da bomba de protões', preco: 800, cat: 'gastrointestinais', req: false, est: 400 },
      { nome: 'Metformina 850mg', desc: 'Antidiabético oral', preco: 650, cat: 'antidiabeticos', req: true, est: 350 },
      { nome: 'Losartana 50mg', desc: 'Anti-hipertensivo', preco: 700, cat: 'cardiovasculares', req: true, est: 250 },
      { nome: 'Dipirona 500mg', desc: 'Analgésico e antitérmico', preco: 300, cat: 'analgesicos', req: false, est: 600 },
      { nome: 'Azitromicina 500mg', desc: 'Antibiótico macrolídeo', preco: 1500, cat: 'antibioticos', req: true, est: 150 },
      { nome: 'Vitamina C 1000mg', desc: 'Suplemento vitamínico', preco: 450, cat: 'vitaminas', req: false, est: 800 },
      { nome: 'Loratadina 10mg', desc: 'Anti-histamínico', preco: 400, cat: 'antialergicos', req: false, est: 350 },
    ];

    for (const med of medicamentos) {
      const medId = crypto.randomUUID();
      await client.query(
        `INSERT INTO medicamentos (id, nome, descricao, preco, categoria, necessita_receita, controlado, dosagem, forma_farmaceutica, fabricante, is_ativo)
         VALUES ($1, $2, $3, $4, $5, $6, $6, $7, 'comprimido', 'Genérico', true)
         ON CONFLICT DO NOTHING`,
        [medId, med.nome, med.desc, med.preco, med.cat, med.req, med.nome.split(' ').slice(1).join(' ')]
      );

      // Add stock per pharmacy
      for (const farmId of [farm1Id, farm2Id, farm3Id]) {
        await client.query(
          `INSERT INTO farmacia_estoque (id, farmacia_id, medicamento_id, quantidade, preco_unitario, preco_venda)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [crypto.randomUUID(), farmId, medId, med.est + Math.floor(Math.random() * 100), med.preco * 0.7, med.preco]
        );
      }
    }
    console.log('✅ Medicamentos criados (10) com estoque em 3 farmácias');

    // ============= PACOTES DE SAÚDE =============
    await client.query(
      `INSERT INTO pacotes_saude (id, nome, descricao, preco_mensal, tipo, duracao_meses, limite_consultas, desconto_medicamentos, beneficios, is_ativo)
       VALUES 
         ($1, 'Básico', 'Acesso a teleconsultas básicas', 5000, 'basico', 1, 2, 5, $4, true),
         ($2, 'Familiar', 'Cobertura para toda a família', 12000, 'familiar', 1, 6, 10, $5, true),
         ($3, 'Premium', 'Acesso ilimitado e prioridade', 25000, 'premium', 1, NULL, 20, $6, true)
       ON CONFLICT DO NOTHING`,
      [
        crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID(),
        JSON.stringify(['2 teleconsultas/mês', '5% desconto medicamentos', 'Chat com médico']),
        JSON.stringify(['6 teleconsultas/mês', '10% desconto medicamentos', 'Consultas para 4 membros', 'Entrega grátis']),
        JSON.stringify(['Consultas ilimitadas', '20% desconto medicamentos', 'Prioridade no atendimento', 'Entrega express grátis', 'Check-up mensal']),
      ]
    );
    console.log('✅ Pacotes de saúde criados (3)');

    await client.query('COMMIT');

    console.log('\n===================================');
    console.log('  🌱 Seed concluído com sucesso!');
    console.log('===================================');
    console.log('\nContas de teste (senha: 123456):');
    console.log('  Admin:           admin@farmadom.ao');
    console.log('  Gerente Hospital: gerente@hgl.ao');
    console.log('  Farmácia Admin:  admin@central.ao');
    console.log('  Gerente Transp.: gerente@transfex.ao');
    console.log('  Motorista:       jose@transfex.ao');
    console.log('  Médico:          antonio@farmadom.ao');
    console.log('  Paciente:        paciente@farmadom.ao');
    console.log('===================================');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed falhou:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
