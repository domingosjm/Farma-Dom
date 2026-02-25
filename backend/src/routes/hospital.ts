import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database';
import { authenticateToken, authorize, AuthRequest } from '../middleware/auth';
import { requireApproval } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticateToken);
router.use(authorize('hospital_gerente', 'admin'));
router.use(requireApproval);

// ============================================
// DASHBOARD
// ============================================

router.get('/dashboard', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const hospitalId = authReq.entidadeId;

  const [medicosStats, consultasStats, faturamento] = await Promise.all([
    query(`
      SELECT 
        COUNT(*) as total_medicos,
        COUNT(*) FILTER (WHERE u.status_conta = 'ativo') as medicos_ativos
      FROM profissionais_saude ps
      JOIN usuarios u ON u.id = ps.usuario_id
      WHERE ps.hospital_id = $1
    `, [hospitalId]),

    query(`
      SELECT 
        COUNT(*) FILTER (WHERE c.status = 'agendada') as consultas_agendadas,
        COUNT(*) FILTER (WHERE c.status = 'em_andamento') as consultas_em_andamento,
        COUNT(*) FILTER (WHERE c.status = 'concluida') as consultas_concluidas,
        COUNT(*) as total_consultas
      FROM consultas c
      WHERE c.hospital_id = $1 
        AND c.created_at >= date_trunc('month', CURRENT_DATE)
    `, [hospitalId]),

    query(`
      SELECT 
        COUNT(*) as consultas_concluidas_mes,
        COALESCE(SUM(c.valor), 0) as receita_bruta,
        COALESCE(SUM(c.valor * (SELECT percentual_hospital FROM hospitais WHERE id = $1) / 100), 0) as receita_hospital
      FROM consultas c
      WHERE c.hospital_id = $1 AND c.status = 'concluida'
        AND c.created_at >= date_trunc('month', CURRENT_DATE)
    `, [hospitalId])
  ]);

  res.json({
    medicos: medicosStats.rows[0],
    consultas: consultasStats.rows[0],
    faturamento: faturamento.rows[0]
  });
});

// ============================================
// PERFIL DO HOSPITAL
// ============================================

router.get('/perfil', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const hospitalId = authReq.entidadeId;

  const result = await query(`
    SELECT h.*,
      (SELECT COUNT(*) FROM profissionais_saude WHERE hospital_id = h.id) as total_medicos,
      (SELECT COUNT(*) FROM consultas WHERE hospital_id = h.id AND status = 'concluida') as total_consultas
    FROM hospitais h WHERE h.id = $1
  `, [hospitalId]);

  if (result.rows.length === 0) {
    throw new AppError('Hospital não encontrado', 404);
  }

  res.json(result.rows[0]);
});

const updatePerfilSchema = z.object({
  nome: z.string().min(2).optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  provincia: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional(),
});

router.put('/perfil', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const hospitalId = authReq.entidadeId;
  const data = updatePerfilSchema.parse(req.body);

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
  }

  if (fields.length === 0) throw new AppError('Nenhum campo', 400);

  fields.push('updated_at = NOW()');
  values.push(hospitalId);

  const result = await query(
    `UPDATE hospitais SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  res.json(result.rows[0]);
});

// ============================================
// MÉDICOS DO HOSPITAL
// ============================================

router.get('/medicos', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const hospitalId = authReq.entidadeId;

  const result = await query(`
    SELECT 
      u.id, u.nome_completo, u.email, u.telefone, u.foto_perfil, u.status_conta,
      ps.especialidade, ps.numero_ordem, ps.disponivel,
      (SELECT COUNT(*) FROM consultas WHERE medico_id = u.id AND status = 'concluida') as total_consultas,
      (SELECT COUNT(*) FROM consultas WHERE medico_id = u.id AND status = 'agendada') as consultas_agendadas
    FROM profissionais_saude ps
    JOIN usuarios u ON u.id = ps.usuario_id
    WHERE ps.hospital_id = $1
    ORDER BY u.nome_completo
  `, [hospitalId]);

  res.json(result.rows);
});

// Link existing doctor to hospital
router.post('/medicos/vincular', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const hospitalId = authReq.entidadeId;
  const { medico_id } = z.object({ medico_id: z.string().uuid() }).parse(req.body);

  // Check doctor exists and is a medico
  const medico = await query(
    `SELECT id FROM usuarios WHERE id = $1 AND tipo_usuario = 'medico'`,
    [medico_id]
  );
  if (medico.rows.length === 0) {
    throw new AppError('Médico não encontrado', 404);
  }

  // Link in profissionais_saude
  const existing = await query(
    `SELECT id FROM profissionais_saude WHERE usuario_id = $1`,
    [medico_id]
  );

  if (existing.rows.length > 0) {
    await query(
      `UPDATE profissionais_saude SET hospital_id = $1, updated_at = NOW() WHERE usuario_id = $2`,
      [hospitalId, medico_id]
    );
  } else {
    await query(
      `INSERT INTO profissionais_saude (usuario_id, hospital_id) VALUES ($1, $2)`,
      [medico_id, hospitalId]
    );
  }

  // Update user entity reference
  await query(
    `UPDATE usuarios SET entidade_id = $1, entidade_tipo = 'hospital' WHERE id = $2`,
    [hospitalId, medico_id]
  );

  res.json({ message: 'Médico vinculado ao hospital' });
});

// Unlink doctor
router.delete('/medicos/:id/desvincular', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const hospitalId = authReq.entidadeId;
  const { id } = req.params;

  await query(
    `UPDATE profissionais_saude SET hospital_id = NULL, updated_at = NOW() WHERE usuario_id = $1 AND hospital_id = $2`,
    [id, hospitalId]
  );

  await query(
    `UPDATE usuarios SET entidade_id = NULL, entidade_tipo = NULL WHERE id = $1 AND entidade_id = $2`,
    [id, hospitalId]
  );

  res.json({ message: 'Médico desvinculado' });
});

// ============================================
// CONSULTAS DO HOSPITAL
// ============================================

router.get('/consultas', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const hospitalId = authReq.entidadeId;
  const { status, medico_id, page = '1', limit = '20' } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  const conditions = ['c.hospital_id = $1'];
  const params: any[] = [hospitalId];
  let idx = 2;

  if (status) {
    conditions.push(`c.status = $${idx}`);
    params.push(status);
    idx++;
  }
  if (medico_id) {
    conditions.push(`c.medico_id = $${idx}`);
    params.push(medico_id);
    idx++;
  }

  const where = conditions.join(' AND ');

  const [consultas, count] = await Promise.all([
    query(`
      SELECT 
        c.*,
        u_med.nome_completo as medico_nome,
        ps.especialidade,
        u_pac.nome_completo as paciente_nome
      FROM consultas c
      JOIN usuarios u_med ON u_med.id = c.medico_id
      JOIN usuarios u_pac ON u_pac.id = c.paciente_id
      LEFT JOIN profissionais_saude ps ON ps.usuario_id = c.medico_id
      WHERE ${where}
      ORDER BY c.data_hora_agendada DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, Number(limit), offset]),
    query(`SELECT COUNT(*) as total FROM consultas c WHERE ${where}`, params)
  ]);

  res.json({
    items: consultas.rows,
    total: Number(count.rows[0].total),
    page: Number(page),
    limit: Number(limit)
  });
});

// ============================================
// RELATÓRIOS
// ============================================

router.get('/relatorios/financeiro', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const hospitalId = authReq.entidadeId;
  const { periodo = '30' } = req.query;

  const result = await query(`
    SELECT 
      date_trunc('day', c.created_at) as data,
      COUNT(*) as total_consultas,
      SUM(c.valor) as receita_bruta,
      SUM(c.valor * (SELECT percentual_hospital FROM hospitais WHERE id = $1) / 100) as receita_hospital
    FROM consultas c
    WHERE c.hospital_id = $1 AND c.status = 'concluida'
      AND c.created_at >= CURRENT_DATE - ($2 || ' days')::INTERVAL
    GROUP BY date_trunc('day', c.created_at)
    ORDER BY data DESC
  `, [hospitalId, periodo]);

  res.json(result.rows);
});

router.get('/relatorios/medicos', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const hospitalId = authReq.entidadeId;

  const result = await query(`
    SELECT 
      u.id, u.nome_completo,
      ps.especialidade,
      COUNT(*) FILTER (WHERE c.status = 'concluida') as consultas_concluidas,
      COUNT(*) FILTER (WHERE c.status = 'agendada') as consultas_agendadas,
      COALESCE(SUM(c.valor) FILTER (WHERE c.status = 'concluida'), 0) as receita_gerada,
      AVG(c.avaliacao) FILTER (WHERE c.avaliacao IS NOT NULL) as media_avaliacao
    FROM profissionais_saude ps
    JOIN usuarios u ON u.id = ps.usuario_id
    LEFT JOIN consultas c ON c.medico_id = u.id AND c.hospital_id = $1
      AND c.created_at >= date_trunc('month', CURRENT_DATE)
    WHERE ps.hospital_id = $1
    GROUP BY u.id, u.nome_completo, ps.especialidade
    ORDER BY consultas_concluidas DESC
  `, [hospitalId]);

  res.json(result.rows);
});

export default router;
