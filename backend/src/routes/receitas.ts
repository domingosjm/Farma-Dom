import { Router, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { query, withTransaction } from '../config/database';
import { authenticateToken, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticateToken);

// ============================================
// MÉDICO: Criar receita digital
// ============================================

const criarReceitaSchema = z.object({
  consulta_id: z.string().uuid().optional(),
  paciente_id: z.string().uuid(),
  validade_dias: z.number().int().min(1).max(365).default(30),
  itens: z.array(z.object({
    medicamento_id: z.string().uuid(),
    quantidade: z.number().int().min(1),
    dosagem: z.string().min(1),
    instrucoes: z.string().optional(),
  })).min(1),
});

router.post('/', authorize('medico'), async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const medicoId = authReq.userId!;
  const data = criarReceitaSchema.parse(req.body);

  // Verificar se paciente existe
  const paciente = await query(
    `SELECT id, nome_completo FROM usuarios WHERE id = $1 AND tipo_usuario = 'paciente'`,
    [data.paciente_id]
  );
  if (paciente.rows.length === 0) {
    throw new AppError('Paciente não encontrado', 404);
  }

  // Verificar se consulta pertence ao médico/paciente
  if (data.consulta_id) {
    const consulta = await query(
      `SELECT id FROM consultas WHERE id = $1 AND medico_id = $2 AND paciente_id = $3`,
      [data.consulta_id, medicoId, data.paciente_id]
    );
    if (consulta.rows.length === 0) {
      throw new AppError('Consulta não encontrada ou não pertence ao médico/paciente', 404);
    }
  }

  // Verificar todos os medicamentos
  const medIds = data.itens.map(i => i.medicamento_id);
  const meds = await query(
    `SELECT id, nome FROM medicamentos WHERE id = ANY($1)`,
    [medIds]
  );
  if (meds.rows.length !== medIds.length) {
    throw new AppError('Um ou mais medicamentos não encontrados', 404);
  }

  const result = await withTransaction(async (client) => {
    const validade = new Date();
    validade.setDate(validade.getDate() + data.validade_dias);

    // Generate QR hash
    const qrData = `${medicoId}:${data.paciente_id}:${Date.now()}`;
    const qrCodeHash = crypto.createHash('sha256').update(qrData).digest('hex');

    // Criar receita
    const receita = await client.query(`
      INSERT INTO receitas_digitais (consulta_id, medico_id, paciente_id, qr_code_hash, validade)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [data.consulta_id || null, medicoId, data.paciente_id, qrCodeHash, validade]);

    const receitaId = receita.rows[0].id;

    // Inserir itens
    for (const item of data.itens) {
      await client.query(`
        INSERT INTO itens_receita (receita_id, medicamento_id, quantidade, dosagem, instrucoes)
        VALUES ($1, $2, $3, $4, $5)
      `, [receitaId, item.medicamento_id, item.quantidade, item.dosagem, item.instrucoes || null]);
    }

    // Retornar receita completa
    const receitaCompleta = await client.query(`
      SELECT 
        r.*,
        u_medico.nome_completo as medico_nome,
        u_paciente.nome_completo as paciente_nome,
        ps.especialidade as medico_especialidade,
        ps.numero_ordem as medico_crm,
        (
          SELECT json_agg(json_build_object(
            'id', ir.id,
            'medicamento_id', ir.medicamento_id,
            'nome', m.nome,
            'principio_ativo', m.principio_ativo,
            'quantidade', ir.quantidade,
            'dosagem', ir.dosagem,
            'instrucoes', ir.instrucoes
          ))
          FROM itens_receita ir
          JOIN medicamentos m ON m.id = ir.medicamento_id
          WHERE ir.receita_id = r.id
        ) as itens
      FROM receitas_digitais r
      JOIN usuarios u_medico ON u_medico.id = r.medico_id
      JOIN usuarios u_paciente ON u_paciente.id = r.paciente_id
      LEFT JOIN profissionais_saude ps ON ps.usuario_id = r.medico_id
      WHERE r.id = $1
    `, [receitaId]);

    return receitaCompleta.rows[0];
  });

  res.status(201).json(result);
});

// ============================================
// VERIFICAR receita (pública com código)
// ============================================

router.get('/verificar/:codigo', async (req, res: Response) => {
  const { codigo } = req.params;

  const result = await query(`
    SELECT 
      r.id,
      r.codigo_verificacao,
      r.validade,
      r.status,
      r.created_at,
      u_medico.nome_completo as medico_nome,
      ps.especialidade as medico_especialidade,
      ps.numero_ordem as medico_crm,
      u_paciente.nome_completo as paciente_nome,
      (
        SELECT json_agg(json_build_object(
          'nome', m.nome,
          'principio_ativo', m.principio_ativo,
          'quantidade', ir.quantidade,
          'dosagem', ir.dosagem,
          'instrucoes', ir.instrucoes
        ))
        FROM itens_receita ir
        JOIN medicamentos m ON m.id = ir.medicamento_id
        WHERE ir.receita_id = r.id
      ) as itens
    FROM receitas_digitais r
    JOIN usuarios u_medico ON u_medico.id = r.medico_id
    JOIN usuarios u_paciente ON u_paciente.id = r.paciente_id
    LEFT JOIN profissionais_saude ps ON ps.usuario_id = r.medico_id
    WHERE r.codigo_verificacao = $1
  `, [codigo]);

  if (result.rows.length === 0) {
    throw new AppError('Receita não encontrada', 404);
  }

  const receita = result.rows[0];
  const isValid = receita.status === 'ativa' && new Date(receita.validade) > new Date();

  res.json({
    ...receita,
    is_valida: isValid,
    motivo_invalida: !isValid
      ? receita.status !== 'ativa'
        ? `Receita ${receita.status}`
        : 'Receita expirada'
      : null
  });
});

// ============================================
// PACIENTE: Minhas receitas
// ============================================

router.get('/minhas', authorize('paciente'), async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const { status, page = '1', limit = '10' } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  const conditions = ['r.paciente_id = $1'];
  const params: any[] = [authReq.userId];
  let paramIndex = 2;

  if (status) {
    conditions.push(`r.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  const [receitas, countResult] = await Promise.all([
    query(`
      SELECT 
        r.*,
        u_medico.nome_completo as medico_nome,
        ps.especialidade as medico_especialidade,
        (
          SELECT json_agg(json_build_object(
            'nome', m.nome,
            'quantidade', ir.quantidade,
            'dosagem', ir.dosagem
          ))
          FROM itens_receita ir
          JOIN medicamentos m ON m.id = ir.medicamento_id
          WHERE ir.receita_id = r.id
        ) as itens
      FROM receitas_digitais r
      JOIN usuarios u_medico ON u_medico.id = r.medico_id
      LEFT JOIN profissionais_saude ps ON ps.usuario_id = r.medico_id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, Number(limit), offset]),
    query(`SELECT COUNT(*) as total FROM receitas_digitais r WHERE ${whereClause}`, params)
  ]);

  res.json({
    items: receitas.rows,
    total: Number(countResult.rows[0].total),
    page: Number(page),
    limit: Number(limit)
  });
});

// ============================================
// MÉDICO: Receitas emitidas
// ============================================

router.get('/emitidas', authorize('medico'), async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const { page = '1', limit = '10' } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  const [receitas, countResult] = await Promise.all([
    query(`
      SELECT 
        r.*,
        u_paciente.nome_completo as paciente_nome,
        (
          SELECT json_agg(json_build_object(
            'nome', m.nome,
            'quantidade', ir.quantidade,
            'dosagem', ir.dosagem
          ))
          FROM itens_receita ir
          JOIN medicamentos m ON m.id = ir.medicamento_id
          WHERE ir.receita_id = r.id
        ) as itens
      FROM receitas_digitais r
      JOIN usuarios u_paciente ON u_paciente.id = r.paciente_id
      WHERE r.medico_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [authReq.userId, Number(limit), offset]),
    query(`SELECT COUNT(*) as total FROM receitas_digitais WHERE medico_id = $1`, [authReq.userId])
  ]);

  res.json({
    items: receitas.rows,
    total: Number(countResult.rows[0].total),
    page: Number(page),
    limit: Number(limit)
  });
});

// ============================================
// FARMÁCIA: Dispensar receita
// ============================================

router.put('/:id/dispensar', authorize('farmacia_admin', 'farmacia_funcionario'), async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;
  const { id } = req.params;

  const receita = await query(
    `SELECT id, status, validade FROM receitas_digitais WHERE id = $1`,
    [id]
  );

  if (receita.rows.length === 0) {
    throw new AppError('Receita não encontrada', 404);
  }

  if (receita.rows[0].status !== 'ativa') {
    throw new AppError(`Receita já está ${receita.rows[0].status}`, 400);
  }

  if (new Date(receita.rows[0].validade) < new Date()) {
    throw new AppError('Receita expirada', 400);
  }

  const result = await query(`
    UPDATE receitas_digitais 
    SET status = 'dispensada', farmacia_dispensou_id = $1, dispensado_em = NOW(), updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `, [farmaciaId, id]);

  res.json(result.rows[0]);
});

// ============================================
// MÉDICO: Cancelar receita
// ============================================

router.put('/:id/cancelar', authorize('medico'), async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const { id } = req.params;

  const result = await query(`
    UPDATE receitas_digitais 
    SET status = 'cancelada', updated_at = NOW()
    WHERE id = $1 AND medico_id = $2 AND status = 'ativa'
    RETURNING *
  `, [id, authReq.userId]);

  if (result.rows.length === 0) {
    throw new AppError('Receita não encontrada ou não pode ser cancelada', 404);
  }

  res.json(result.rows[0]);
});

// ============================================
// GET /:id - Detalhes da receita
// ============================================

router.get('/:id', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const { id } = req.params;

  const result = await query(`
    SELECT 
      r.*,
      u_medico.nome_completo as medico_nome,
      u_paciente.nome_completo as paciente_nome,
      ps.especialidade as medico_especialidade,
      ps.numero_ordem as medico_crm,
      f.nome as farmacia_dispensou_nome,
      (
        SELECT json_agg(json_build_object(
          'id', ir.id,
          'medicamento_id', ir.medicamento_id,
          'nome', m.nome,
          'principio_ativo', m.principio_ativo,
          'quantidade', ir.quantidade,
          'dosagem', ir.dosagem,
          'instrucoes', ir.instrucoes
        ))
        FROM itens_receita ir
        JOIN medicamentos m ON m.id = ir.medicamento_id
        WHERE ir.receita_id = r.id
      ) as itens
    FROM receitas_digitais r
    JOIN usuarios u_medico ON u_medico.id = r.medico_id
    JOIN usuarios u_paciente ON u_paciente.id = r.paciente_id
    LEFT JOIN profissionais_saude ps ON ps.usuario_id = r.medico_id
    LEFT JOIN farmacias f ON f.id = r.farmacia_dispensou_id
    WHERE r.id = $1
  `, [id]);

  if (result.rows.length === 0) {
    throw new AppError('Receita não encontrada', 404);
  }

  // Only allow: the prescribing doctor, the patient, pharmacy staff, or admin
  const receita = result.rows[0];
  const user = authReq.user!;
  const isOwner = user.id === receita.medico_id || user.id === receita.paciente_id;
  const isAdmin = user.tipo_usuario === 'admin';
  const isFarmacia = ['farmacia_admin', 'farmacia_funcionario'].includes(user.tipo_usuario);

  if (!isOwner && !isAdmin && !isFarmacia) {
    throw new AppError('Acesso negado', 403);
  }

  res.json(receita);
});

export default router;
