import { Router, Response } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../config/database';
import { authenticateToken, authorize, AuthRequest } from '../middleware/auth';
import { requireApproval } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticateToken);

// ============================================
// GERENTE DE TRANSPORTE: Dashboard
// ============================================

router.get('/dashboard', authorize('transporte_gerente', 'admin'), requireApproval, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const empresaId = authReq.entidadeId;

  const [entregasStats, motoristasStats, veiculosStats, faturamento] = await Promise.all([
    query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'aguardando') as aguardando,
        COUNT(*) FILTER (WHERE status = 'aceita') as aceitas,
        COUNT(*) FILTER (WHERE status = 'recolhida') as em_rota,
        COUNT(*) FILTER (WHERE status = 'entregue') as entregues,
        COUNT(*) as total
      FROM entregas
      WHERE empresa_transporte_id = $1 
        AND created_at >= date_trunc('month', CURRENT_DATE)
    `, [empresaId]),

    query(`
      SELECT 
        COUNT(*) as total_motoristas,
        COUNT(*) FILTER (WHERE u.id IN (
          SELECT DISTINCT motorista_id FROM entregas 
          WHERE status IN ('aceita', 'recolhida') AND motorista_id IS NOT NULL
        )) as motoristas_ativos
      FROM usuarios u
      WHERE u.entidade_id = $1 AND u.tipo_usuario = 'motorista' AND u.status_conta = 'ativo'
    `, [empresaId]),

    query(`
      SELECT 
        COUNT(*) as total_veiculos,
        COUNT(*) FILTER (WHERE is_ativo = true) as veiculos_ativos
      FROM veiculos
      WHERE empresa_id = $1
    `, [empresaId]),

    query(`
      SELECT 
        COALESCE(SUM(valor_entrega), 0) as faturamento_mes,
        COUNT(*) FILTER (WHERE status = 'entregue') as entregas_concluidas
      FROM entregas
      WHERE empresa_transporte_id = $1 AND status = 'entregue'
        AND created_at >= date_trunc('month', CURRENT_DATE)
    `, [empresaId])
  ]);

  res.json({
    entregas: entregasStats.rows[0],
    motoristas: motoristasStats.rows[0],
    veiculos: veiculosStats.rows[0],
    faturamento: faturamento.rows[0]
  });
});

// ============================================
// GERENTE: Gestão de Motoristas
// ============================================

router.get('/motoristas', authorize('transporte_gerente', 'admin'), requireApproval, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const empresaId = authReq.entidadeId;

  const result = await query(`
    SELECT 
      u.id, u.nome_completo, u.email, u.telefone, u.foto_perfil, u.status_conta, u.created_at,
      (SELECT COUNT(*) FROM entregas WHERE motorista_id = u.id AND status = 'entregue') as total_entregas,
      (SELECT COUNT(*) FROM entregas WHERE motorista_id = u.id AND status IN ('aceita', 'recolhida')) as entregas_ativas
    FROM usuarios u
    WHERE u.entidade_id = $1 AND u.tipo_usuario = 'motorista'
    ORDER BY u.nome_completo
  `, [empresaId]);

  res.json(result.rows);
});

const addMotoristaSchema = z.object({
  nome_completo: z.string().min(3),
  email: z.string().email(),
  telefone: z.string().optional(),
});

router.post('/motoristas', authorize('transporte_gerente', 'admin'), requireApproval, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const empresaId = authReq.entidadeId;
  const data = addMotoristaSchema.parse(req.body);

  const existing = await query('SELECT id FROM usuarios WHERE email = $1', [data.email]);
  if (existing.rows.length > 0) {
    throw new AppError('Email já está em uso', 409);
  }

  const bcrypt = await import('bcryptjs');
  const senhaTemp = Math.random().toString(36).slice(-8);
  const senhaHash = await bcrypt.hash(senhaTemp, 10);

  const result = await query(`
    INSERT INTO usuarios (nome_completo, email, telefone, senha_hash, tipo_usuario, entidade_id, entidade_tipo, status_conta)
    VALUES ($1, $2, $3, $4, 'motorista', $5, 'empresa_transporte', 'ativo')
    RETURNING id, nome_completo, email, telefone, tipo_usuario, status_conta, created_at
  `, [data.nome_completo, data.email, data.telefone || null, senhaHash, empresaId]);

  res.status(201).json({ ...result.rows[0], _senha_temporaria: senhaTemp });
});

router.delete('/motoristas/:id', authorize('transporte_gerente', 'admin'), requireApproval, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const empresaId = authReq.entidadeId;
  const { id } = req.params;

  // Check no active deliveries
  const active = await query(
    `SELECT COUNT(*) as c FROM entregas WHERE motorista_id = $1 AND status IN ('aceita', 'recolhida')`,
    [id]
  );
  if (Number(active.rows[0].c) > 0) {
    throw new AppError('Motorista tem entregas ativas. Conclua-as antes de remover.', 400);
  }

  const result = await query(
    `DELETE FROM usuarios WHERE id = $1 AND entidade_id = $2 AND tipo_usuario = 'motorista' RETURNING id`,
    [id, empresaId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Motorista não encontrado', 404);
  }

  res.json({ message: 'Motorista removido' });
});

// ============================================
// GERENTE: Gestão de Veículos
// ============================================

router.get('/veiculos', authorize('transporte_gerente', 'admin'), requireApproval, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const empresaId = authReq.entidadeId;

  const result = await query(`
    SELECT * FROM veiculos WHERE empresa_id = $1 ORDER BY placa
  `, [empresaId]);

  res.json(result.rows);
});

const veiculoSchema = z.object({
  placa: z.string().min(3),
  modelo: z.string().min(2),
  tipo: z.string().optional(),
  capacidade_kg: z.number().positive().optional(),
});

router.post('/veiculos', authorize('transporte_gerente', 'admin'), requireApproval, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const empresaId = authReq.entidadeId;
  const data = veiculoSchema.parse(req.body);

  const result = await query(`
    INSERT INTO veiculos (empresa_id, placa, modelo, tipo, capacidade_kg)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [empresaId, data.placa, data.modelo, data.tipo || null, data.capacidade_kg || null]);

  res.status(201).json(result.rows[0]);
});

router.put('/veiculos/:id', authorize('transporte_gerente', 'admin'), requireApproval, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const empresaId = authReq.entidadeId;
  const { id } = req.params;
  const data = veiculoSchema.partial().parse(req.body);

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

  if (fields.length === 0) {
    throw new AppError('Nenhum campo para atualizar', 400);
  }

  values.push(id, empresaId);
  const result = await query(
    `UPDATE veiculos SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} AND empresa_id = $${idx + 1} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('Veículo não encontrado', 404);
  }

  res.json(result.rows[0]);
});

router.delete('/veiculos/:id', authorize('transporte_gerente', 'admin'), requireApproval, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const empresaId = authReq.entidadeId;
  const { id } = req.params;

  const result = await query(
    `DELETE FROM veiculos WHERE id = $1 AND empresa_id = $2 RETURNING id`,
    [id, empresaId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Veículo não encontrado', 404);
  }

  res.json({ message: 'Veículo removido' });
});

// ============================================
// GERENTE: Ver entregas da empresa
// ============================================

router.get('/entregas', authorize('transporte_gerente', 'admin'), requireApproval, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const empresaId = authReq.entidadeId;
  const { status, page = '1', limit = '20' } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  const conditions = ['e.empresa_transporte_id = $1'];
  const params: any[] = [empresaId];
  let idx = 2;

  if (status) {
    conditions.push(`e.status = $${idx}`);
    params.push(status);
    idx++;
  }

  const where = conditions.join(' AND ');

  const [entregas, count] = await Promise.all([
    query(`
      SELECT 
        e.*,
        p.numero_pedido,
        p.total as valor_pedido,
        f.nome as farmacia_nome,
        f.endereco as farmacia_endereco,
        u_mot.nome_completo as motorista_nome,
        u_cli.nome_completo as cliente_nome,
        u_cli.telefone as cliente_telefone,
        p.endereco_entrega
      FROM entregas e
      JOIN pedidos p ON p.id = e.pedido_id
      JOIN farmacias f ON f.id = e.farmacia_id
      JOIN usuarios u_cli ON u_cli.id = p.usuario_id
      LEFT JOIN usuarios u_mot ON u_mot.id = e.motorista_id
      WHERE ${where}
      ORDER BY
        CASE e.status WHEN 'aguardando' THEN 1 WHEN 'aceita' THEN 2 WHEN 'recolhida' THEN 3 ELSE 4 END,
        e.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, Number(limit), offset]),
    query(`SELECT COUNT(*) as total FROM entregas e WHERE ${where}`, params)
  ]);

  res.json({
    items: entregas.rows,
    total: Number(count.rows[0].total),
    page: Number(page),
    limit: Number(limit)
  });
});

// Assign driver to delivery
router.put('/entregas/:id/atribuir', authorize('transporte_gerente', 'admin'), requireApproval, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const empresaId = authReq.entidadeId;
  const { id } = req.params;
  const { motorista_id, veiculo_id } = z.object({
    motorista_id: z.string().uuid(),
    veiculo_id: z.string().uuid().optional(),
  }).parse(req.body);

  // Verify delivery belongs to company
  const entrega = await query(
    `SELECT id, status FROM entregas WHERE id = $1 AND empresa_transporte_id = $2`,
    [id, empresaId]
  );
  if (entrega.rows.length === 0) {
    throw new AppError('Entrega não encontrada', 404);
  }

  // Verify driver belongs to company
  const motorista = await query(
    `SELECT id FROM usuarios WHERE id = $1 AND entidade_id = $2 AND tipo_usuario = 'motorista'`,
    [motorista_id, empresaId]
  );
  if (motorista.rows.length === 0) {
    throw new AppError('Motorista não encontrado', 404);
  }

  const result = await query(`
    UPDATE entregas 
    SET motorista_id = $1, veiculo_id = $2, status = 'aceita', aceita_em = NOW(), updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `, [motorista_id, veiculo_id || null, id]);

  res.json(result.rows[0]);
});

// ============================================
// MOTORISTA: Minhas entregas
// ============================================

router.get('/motorista/entregas', authorize('motorista'), requireApproval, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const { status } = req.query;

  const conditions = ['e.motorista_id = $1'];
  const params: any[] = [authReq.userId];
  let idx = 2;

  if (status) {
    conditions.push(`e.status = $${idx}`);
    params.push(status);
    idx++;
  }

  const result = await query(`
    SELECT 
      e.*,
      p.numero_pedido,
      p.total as valor_pedido,
      p.endereco_entrega,
      f.nome as farmacia_nome,
      f.endereco as farmacia_endereco,
      f.telefone as farmacia_telefone,
      u_cli.nome_completo as cliente_nome,
      u_cli.telefone as cliente_telefone
    FROM entregas e
    JOIN pedidos p ON p.id = e.pedido_id
    JOIN farmacias f ON f.id = e.farmacia_id
    JOIN usuarios u_cli ON u_cli.id = p.usuario_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY
      CASE e.status WHEN 'aceita' THEN 1 WHEN 'recolhida' THEN 2 ELSE 3 END,
      e.created_at DESC
  `, params);

  res.json(result.rows);
});

// MOTORISTA: Update GPS
router.put('/motorista/entregas/:id/gps', authorize('motorista'), async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const { id } = req.params;
  const { latitude, longitude } = z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).parse(req.body);

  const result = await query(`
    UPDATE entregas 
    SET latitude_atual = $1, longitude_atual = $2, updated_at = NOW()
    WHERE id = $3 AND motorista_id = $4 AND status IN ('aceita', 'recolhida')
    RETURNING id, latitude_atual, longitude_atual
  `, [latitude, longitude, id, authReq.userId]);

  if (result.rows.length === 0) {
    throw new AppError('Entrega não encontrada ou não está ativa', 404);
  }

  // TODO: Emit GPS update via Socket.IO
  // io.to(`pedido_${result.rows[0].pedido_id}`).emit('gps_update', { latitude, longitude });

  res.json(result.rows[0]);
});

// MOTORISTA: Marcar como recolhida (picked up from pharmacy)
router.put('/motorista/entregas/:id/recolher', authorize('motorista'), async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const { id } = req.params;

  const result = await query(`
    UPDATE entregas 
    SET status = 'recolhida', recolhido_em = NOW(), updated_at = NOW()
    WHERE id = $1 AND motorista_id = $2 AND status = 'aceita'
    RETURNING *
  `, [id, authReq.userId]);

  if (result.rows.length === 0) {
    throw new AppError('Entrega não encontrada ou já recolhida', 404);
  }

  // Update pedido status
  await query(
    `UPDATE pedidos SET status = 'em_transito', updated_at = NOW() WHERE id = $1`,
    [result.rows[0].pedido_id]
  );

  res.json(result.rows[0]);
});

// MOTORISTA: Mark as delivered
router.put('/motorista/entregas/:id/entregar', authorize('motorista'), async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const { id } = req.params;
  const { foto_comprovante, observacoes } = z.object({
    foto_comprovante: z.string().optional(),
    observacoes: z.string().optional(),
  }).parse(req.body);

  const result = await withTransaction(async (client) => {
    const entrega = await client.query(`
      UPDATE entregas 
      SET status = 'entregue', entregue_em = NOW(), foto_comprovante = $3, observacoes = $4, updated_at = NOW()
      WHERE id = $1 AND motorista_id = $2 AND status = 'recolhida'
      RETURNING *
    `, [id, authReq.userId, foto_comprovante || null, observacoes || null]);

    if (entrega.rows.length === 0) {
      throw new AppError('Entrega não encontrada ou não está em trânsito', 404);
    }

    // Update pedido status
    await client.query(
      `UPDATE pedidos SET status = 'entregue', updated_at = NOW() WHERE id = $1`,
      [entrega.rows[0].pedido_id]
    );

    return entrega.rows[0];
  });

  res.json(result);
});

export default router;
