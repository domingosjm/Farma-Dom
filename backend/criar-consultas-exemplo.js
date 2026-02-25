const mysql = require('mysql2/promise');

async function criarConsultasExemplo() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'farmadom'
    });

    console.log('✅ Conectado ao banco de dados');

    // Buscar ID do médico
    const [medicos] = await connection.execute(
      'SELECT id FROM usuarios WHERE email = ? AND tipo_usuario = "medico"',
      ['medico@farmadom.ao']
    );

    if (medicos.length === 0) {
      console.log('❌ Médico não encontrado');
      return;
    }

    const medicoId = medicos[0].id;
    console.log(`✅ Médico encontrado: ${medicoId}`);

    // Buscar pacientes
    const [pacientes] = await connection.execute(
      'SELECT id, nome_completo FROM usuarios WHERE tipo_usuario = "paciente" LIMIT 5'
    );

    if (pacientes.length === 0) {
      console.log('❌ Nenhum paciente encontrado');
      return;
    }

    console.log(`✅ Encontrados ${pacientes.length} pacientes`);

    // Criar consultas para hoje
    const hoje = new Date();
    const consultas = [
      {
        pacienteIdx: 0,
        horario: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 9, 0),
        tipo: 'video',
        status: 'confirmada',
        sintomas: 'Dor de cabeça persistente há 3 dias',
        valor: 5000
      },
      {
        pacienteIdx: 1,
        horario: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 10, 30),
        tipo: 'presencial',
        status: 'confirmada',
        sintomas: 'Consulta de rotina - check-up anual',
        valor: 10000
      },
      {
        pacienteIdx: 2,
        horario: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 14, 0),
        tipo: 'chat',
        status: 'agendada',
        sintomas: 'Febre e tosse',
        valor: 3000
      },
      {
        pacienteIdx: 3,
        horario: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 16, 0),
        tipo: 'video',
        status: 'agendada',
        sintomas: 'Dores nas costas',
        valor: 5000
      },
      {
        pacienteIdx: 0,
        horario: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1, 9, 0),
        tipo: 'video',
        status: 'agendada',
        sintomas: 'Retorno - acompanhamento',
        valor: 5000
      }
    ];

    for (const consulta of consultas) {
      if (!pacientes[consulta.pacienteIdx]) continue;

      const paciente = pacientes[consulta.pacienteIdx];

      await connection.execute(
        `INSERT INTO consultas (
          paciente_id, medico_id, data_hora_agendada, tipo_consulta,
          status, sintomas, valor
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          paciente.id,
          medicoId,
          consulta.horario,
          consulta.tipo,
          consulta.status,
          consulta.sintomas,
          consulta.valor
        ]
      );

      console.log(`✅ Consulta criada: ${paciente.nome_completo} - ${consulta.horario.toLocaleString()}`);
    }

    // Criar algumas consultas concluídas do mês passado
    const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 15);
    
    for (let i = 0; i < 10; i++) {
      const paciente = pacientes[i % pacientes.length];
      const dataConsulta = new Date(mesPassado);
      dataConsulta.setDate(dataConsulta.getDate() + i * 2);

      await connection.execute(
        `INSERT INTO consultas (
          paciente_id, medico_id, data_hora_agendada, tipo_consulta,
          status, sintomas, diagnostico, valor
        ) VALUES (?, ?, ?, ?, 'concluida', ?, ?, ?)`,
        [
          paciente.id,
          medicoId,
          dataConsulta,
          ['video', 'presencial'][i % 2],
          'Consulta de rotina',
          'Paciente saudável, sem alterações',
          [5000, 10000][i % 2]
        ]
      );
    }

    console.log('✅ Consultas de exemplo criadas com sucesso!');
    console.log('\n📊 Resumo:');
    console.log('- Consultas para hoje: 4');
    console.log('- Consultas para amanhã: 1');
    console.log('- Consultas concluídas (mês passado): 10');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

criarConsultasExemplo();
