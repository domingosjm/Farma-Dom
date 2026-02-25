import express, { Response } from 'express';
import { authenticateToken, authorize, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

const router = express.Router();

// Todas as rotas requerem autenticação + papel médico
router.use(authenticateToken);
router.use(authorize('medico'));

// GET /api/v1/medico/stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const medicoId = req.userId;

    const [
      consultasHoje,
      consultasSemana,
      pacientesTotal,
      proximaConsulta,
      receita,
    ] = await Promise.all([
      query(
        `SELECT COUNT(*) as total FROM consultas 
         WHERE medico_id = $1 AND DATE(data_hora_agendada) = CURRENT_DATE
         AND status IN ('confirmada', 'agendada', 'em_andamento')`,
        [medicoId]
      ),
      query(
        `SELECT COUNT(*) as total FROM consultas 
         WHERE medico_id = $1 
         AND data_hora_agendada >= date_trunc('week', CURRENT_DATE)
         AND data_hora_agendada < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
         AND status IN ('confirmada', 'agendada', 'em_andamento', 'concluida')`,
        [medicoId]
      ),
      query(
        `SELECT COUNT(DISTINCT paciente_id) as total FROM consultas WHERE medico_id = $1`,
        [medicoId]
      ),
      query(
        `SELECT c.id, c.data_hora_agendada as data_consulta, c.tipo_consulta, c.status,
                u.nome_completo as paciente_nome
         FROM consultas c
         INNER JOIN usuarios u ON c.paciente_id = u.id
         WHERE c.medico_id = $1
         AND c.data_hora_agendada >= NOW()
         AND c.status IN ('confirmada', 'agendada')
         ORDER BY c.data_hora_agendada ASC LIMIT 1`,
        [medicoId]
      ),
      query(
        `SELECT COALESCE(SUM(valor), 0) as total FROM consultas 
         WHERE medico_id = $1
         AND EXTRACT(MONTH FROM data_hora_agendada) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(YEAR FROM data_hora_agendada) = EXTRACT(YEAR FROM CURRENT_DATE)
         AND status = 'concluida'`,
        [medicoId]
      ),
    ]);

    res.json({
      consultas_hoje: parseInt(consultasHoje.rows[0]?.total) || 0,
      consultas_semana: parseInt(consultasSemana.rows[0]?.total) || 0,
      pacientes_total: parseInt(pacientesTotal.rows[0]?.total) || 0,
      proxima_consulta: proximaConsulta.rows[0] || null,
      avaliacoes_media: '4.5',
      total_avaliacoes: 0,
      receita_mes: parseFloat(receita.rows[0]?.total) || 0,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
});

// GET /api/v1/medico/consultas-hoje
router.get('/consultas-hoje', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT c.id, c.data_hora_agendada as data_consulta, c.tipo_consulta, c.status, c.sintomas,
              u.nome_completo as paciente_nome, u.foto_perfil
       FROM consultas c
       INNER JOIN usuarios u ON c.paciente_id = u.id
       WHERE c.medico_id = $1 AND DATE(c.data_hora_agendada) = CURRENT_DATE
       ORDER BY c.data_hora_agendada ASC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar consultas de hoje:', error);
    res.status(500).json({ message: 'Erro ao buscar consultas de hoje' });
  }
});

// GET /api/v1/medico/consultas
router.get('/consultas', async (req: AuthRequest, res: Response) => {
  try {
    const { status, data_inicio, data_fim } = req.query;

    let sql = `
      SELECT c.id, c.data_hora_agendada as data_consulta, c.tipo_consulta, c.status,
             c.sintomas, c.diagnostico, c.prescricao, c.valor,
             u.nome_completo as paciente_nome, u.telefone as paciente_telefone,
             u.email as paciente_email, u.foto_perfil,
             h.nome as hospital_nome
      FROM consultas c
      INNER JOIN usuarios u ON c.paciente_id = u.id
      LEFT JOIN hospitais h ON c.hospital_id = h.id
      WHERE c.medico_id = $1
    `;
    const params: any[] = [req.userId];
    let paramIndex = 2;

    if (status) {
      sql += ` AND c.status = $${paramIndex++}`;
      params.push(status);
    }
    if (data_inicio) {
      sql += ` AND DATE(c.data_hora_agendada) >= $${paramIndex++}`;
      params.push(data_inicio);
    }
    if (data_fim) {
      sql += ` AND DATE(c.data_hora_agendada) <= $${paramIndex++}`;
      params.push(data_fim);
    }

    sql += ' ORDER BY c.data_hora_agendada DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar consultas:', error);
    res.status(500).json({ message: 'Erro ao buscar consultas' });
  }
});

// PUT /api/v1/medico/consultas/:id/iniciar
router.put('/consultas/:id/iniciar', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const check = await query(
      'SELECT id FROM consultas WHERE id = $1 AND medico_id = $2',
      [id, req.userId]
    );

    if (check.rows.length === 0) {
      res.status(404).json({ message: 'Consulta não encontrada' });
      return;
    }

    await query(
      "UPDATE consultas SET status = 'em_andamento', data_hora_realizada = NOW(), updated_at = NOW() WHERE id = $1",
      [id]
    );

    res.json({ message: 'Consulta iniciada com sucesso' });
  } catch (error) {
    console.error('Erro ao iniciar consulta:', error);
    res.status(500).json({ message: 'Erro ao iniciar consulta' });
  }
});

// PUT /api/v1/medico/consultas/:id/concluir
router.put('/consultas/:id/concluir', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { diagnostico, prescricao, observacoes } = req.body;

    const check = await query(
      'SELECT id FROM consultas WHERE id = $1 AND medico_id = $2',
      [id, req.userId]
    );

    if (check.rows.length === 0) {
      res.status(404).json({ message: 'Consulta não encontrada' });
      return;
    }

    await query(
      `UPDATE consultas 
       SET status = 'concluida', diagnostico = $1, prescricao = $2, observacoes = $3, updated_at = NOW()
       WHERE id = $4`,
      [diagnostico, prescricao, observacoes, id]
    );

    res.json({ message: 'Consulta concluída com sucesso' });
  } catch (error) {
    console.error('Erro ao concluir consulta:', error);
    res.status(500).json({ message: 'Erro ao concluir consulta' });
  }
});

// GET /api/v1/medico/pacientes
router.get('/pacientes', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT DISTINCT
        u.id, u.nome_completo, u.email, u.telefone, u.foto_perfil, u.data_nascimento, u.genero,
        COUNT(c.id) as total_consultas,
        MAX(c.data_hora_agendada) as ultima_consulta
      FROM usuarios u
      INNER JOIN consultas c ON u.id = c.paciente_id
      WHERE c.medico_id = $1
      GROUP BY u.id, u.nome_completo, u.email, u.telefone, u.foto_perfil, u.data_nascimento, u.genero
      ORDER BY MAX(c.data_hora_agendada) DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    res.status(500).json({ message: 'Erro ao buscar pacientes' });
  }
});

// GET /api/v1/medico/pacientes/:id/historico
router.get('/pacientes/:id/historico', async (req: AuthRequest, res: Response) => {
  try {
    const pacienteId = req.params.id;

    // Verificar se o médico já atendeu este paciente
    const check = await query(
      'SELECT id FROM consultas WHERE medico_id = $1 AND paciente_id = $2 LIMIT 1',
      [req.userId, pacienteId]
    );

    if (check.rows.length === 0) {
      res.status(403).json({ message: 'Acesso negado' });
      return;
    }

    const result = await query(
      `SELECT c.id, c.data_hora_agendada as data_consulta, c.tipo_consulta, c.status,
              c.sintomas, c.diagnostico, c.prescricao, c.observacoes, c.valor,
              m.nome_completo as medico_nome, ps.especialidade
       FROM consultas c
       LEFT JOIN usuarios m ON c.medico_id = m.id
       LEFT JOIN profissionais_saude ps ON m.id = ps.usuario_id
       WHERE c.paciente_id = $1
       ORDER BY c.data_hora_agendada DESC`,
      [pacienteId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ message: 'Erro ao buscar histórico' });
  }
});

// GET /api/v1/medico/perfil
router.get('/perfil', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT u.id, u.nome_completo, u.email, u.telefone, u.foto_perfil,
              ps.numero_ordem, ps.especialidade, ps.anos_experiencia, ps.biografia,
              ps.atende_domicilio, ps.atende_online, ps.valor_consulta_online,
              ps.valor_consulta_domicilio, ps.disponivel
       FROM usuarios u
       INNER JOIN profissionais_saude ps ON u.id = ps.usuario_id
       WHERE u.id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Perfil não encontrado' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ message: 'Erro ao buscar perfil' });
  }
});

// PUT /api/v1/medico/perfil
router.put('/perfil', async (req: AuthRequest, res: Response) => {
  try {
    const { especialidade, anos_experiencia, biografia, atende_domicilio, atende_online,
            valor_consulta_online, valor_consulta_domicilio } = req.body;

    await query(
      `UPDATE profissionais_saude 
       SET especialidade = COALESCE($1, especialidade),
           anos_experiencia = COALESCE($2, anos_experiencia),
           biografia = COALESCE($3, biografia),
           atende_domicilio = COALESCE($4, atende_domicilio),
           atende_online = COALESCE($5, atende_online),
           valor_consulta_online = COALESCE($6, valor_consulta_online),
           valor_consulta_domicilio = COALESCE($7, valor_consulta_domicilio),
           updated_at = NOW()
       WHERE usuario_id = $8`,
      [especialidade, anos_experiencia, biografia, atende_domicilio, atende_online,
       valor_consulta_online, valor_consulta_domicilio, req.userId]
    );

    res.json({ message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
});

// PUT /api/v1/medico/disponibilidade
router.put('/disponibilidade', async (req: AuthRequest, res: Response) => {
  try {
    const { disponivel } = req.body;

    await query(
      'UPDATE profissionais_saude SET disponivel = $1, updated_at = NOW() WHERE usuario_id = $2',
      [disponivel, req.userId]
    );

    res.json({ message: 'Disponibilidade atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar disponibilidade:', error);
    res.status(500).json({ message: 'Erro ao atualizar disponibilidade' });
  }
});

export default router;
