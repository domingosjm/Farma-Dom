import { Router, Response } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../config/database';
import { authenticateToken, authorize, scopeToEntity, AuthRequest } from '../middleware/auth';
import { requireApproval } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication + pharmacy role + approved account
router.use(authenticateToken);
router.use(authorize('farmacia_admin', 'farmacia_funcionario', 'admin'));
router.use(requireApproval);

// ============================================
// DASHBOARD / STATS
// ============================================

// GET /farmacia/dashboard - Estatísticas da farmácia
router.get('/dashboard', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;

  if (!farmaciaId && authReq.user?.tipo_usuario !== 'admin') {
    throw new AppError('Farmácia não associada', 400);
  }

  const [
    pedidosStats,
    estoqueStats,
    faturamento,
    rodizioStats
  ] = await Promise.all([
    // Estatísticas de pedidos
    query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'aguardando_farmacia') as pedidos_pendentes,
        COUNT(*) FILTER (WHERE status = 'em_preparacao') as pedidos_preparando,
        COUNT(*) FILTER (WHERE status = 'pronto_entrega') as pedidos_prontos,
        COUNT(*) FILTER (WHERE status = 'entregue') as pedidos_entregues,
        COUNT(*) as total_pedidos
      FROM pedidos 
      WHERE farmacia_id = $1 
        AND created_at >= date_trunc('month', CURRENT_DATE)
    `, [farmaciaId]),

    // Estatísticas de estoque
    query(`
      SELECT 
        COUNT(*) as total_produtos,
        COUNT(*) FILTER (WHERE quantidade <= 10) as estoque_baixo,
        COUNT(*) FILTER (WHERE quantidade = 0) as sem_estoque
      FROM farmacia_estoque 
      WHERE farmacia_id = $1
    `, [farmaciaId]),

    // Faturamento do mês
    query(`
      SELECT 
        COALESCE(SUM(total), 0) as faturamento_mes,
        COUNT(*) as pedidos_concluidos
      FROM pedidos 
      WHERE farmacia_id = $1 
        AND status = 'entregue'
        AND created_at >= date_trunc('month', CURRENT_DATE)
    `, [farmaciaId]),

    // Rodízio stats
    query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pendente') as rodizio_pendentes,
        COUNT(*) FILTER (WHERE status = 'aceito') as rodizio_aceitos,
        COUNT(*) FILTER (WHERE status = 'recusado') as rodizio_recusados
      FROM fila_rodizio 
      WHERE farmacia_id = $1 
        AND created_at >= date_trunc('month', CURRENT_DATE)
    `, [farmaciaId])
  ]);

  res.json({
    pedidos: pedidosStats.rows[0],
    estoque: estoqueStats.rows[0],
    faturamento: faturamento.rows[0],
    rodizio: rodizioStats.rows[0]
  });
});

// ============================================
// PERFIL DA FARMÁCIA
// ============================================

// GET /farmacia/perfil - Dados da farmácia
router.get('/perfil', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;

  const result = await query(`
    SELECT f.*, 
      (SELECT COUNT(*) FROM farmacia_estoque WHERE farmacia_id = f.id) as total_produtos,
      (SELECT COUNT(*) FROM pedidos WHERE farmacia_id = f.id AND status = 'entregue') as total_vendas
    FROM farmacias f 
    WHERE f.id = $1
  `, [farmaciaId]);

  if (result.rows.length === 0) {
    throw new AppError('Farmácia não encontrada', 404);
  }

  res.json(result.rows[0]);
});

// PUT /farmacia/perfil - Atualizar perfil
const updatePerfilSchema = z.object({
  nome: z.string().min(2).optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  provincia: z.string().optional(),
  zona: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional(),
  horario_funcionamento: z.record(z.any()).optional(),
  aceita_parcelamento: z.boolean().optional(),
});

router.put('/perfil', authorize('farmacia_admin', 'admin'), async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;
  const data = updatePerfilSchema.parse(req.body);

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(key === 'horario_funcionamento' ? JSON.stringify(value) : value);
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    throw new AppError('Nenhum campo para atualizar', 400);
  }

  fields.push(`updated_at = NOW()`);
  values.push(farmaciaId);

  const result = await query(
    `UPDATE farmacias SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  res.json(result.rows[0]);
});

// PUT /farmacia/online - Alternar status online/offline
router.put('/online', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;
  const { is_online } = z.object({ is_online: z.boolean() }).parse(req.body);

  const result = await query(
    `UPDATE farmacias SET is_online = $1, updated_at = NOW() WHERE id = $2 RETURNING id, is_online`,
    [is_online, farmaciaId]
  );

  res.json(result.rows[0]);
});

// ============================================
// GESTÃO DE ESTOQUE
// ============================================

// GET /farmacia/estoque - Listar estoque da farmácia
router.get('/estoque', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;
  const { search, categoria, baixo_estoque, page = '1', limit = '20' } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  const conditions = ['fe.farmacia_id = $1'];
  const params: any[] = [farmaciaId];
  let paramIndex = 2;

  if (search) {
    conditions.push(`(m.nome ILIKE $${paramIndex} OR m.principio_ativo ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (categoria) {
    conditions.push(`m.categoria = $${paramIndex}`);
    params.push(categoria);
    paramIndex++;
  }

  if (baixo_estoque === 'true') {
    conditions.push(`fe.quantidade <= 10`);
  }

  const whereClause = conditions.join(' AND ');

  const [items, countResult] = await Promise.all([
    query(`
      SELECT 
        fe.id,
        fe.medicamento_id,
        fe.quantidade,
        fe.preco_farmacia,
        fe.updated_at,
        m.nome,
        m.principio_ativo,
        m.dosagem,
        m.forma_farmaceutica,
        m.categoria,
        m.preco as preco_referencia,
        m.requer_receita,
        m.imagem_url
      FROM farmacia_estoque fe
      JOIN medicamentos m ON m.id = fe.medicamento_id
      WHERE ${whereClause}
      ORDER BY m.nome ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, Number(limit), offset]),
    query(`
      SELECT COUNT(*) as total
      FROM farmacia_estoque fe
      JOIN medicamentos m ON m.id = fe.medicamento_id
      WHERE ${whereClause}
    `, params)
  ]);

  res.json({
    items: items.rows,
    total: Number(countResult.rows[0].total),
    page: Number(page),
    limit: Number(limit)
  });
});

// POST /farmacia/estoque - Adicionar medicamento ao estoque
const addEstoqueSchema = z.object({
  medicamento_id: z.string().uuid(),
  quantidade: z.number().int().min(0),
  preco_farmacia: z.number().positive().optional(),
});

router.post('/estoque', authorize('farmacia_admin', 'admin'), async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;
  const data = addEstoqueSchema.parse(req.body);

  // Verificar se medicamento existe
  const med = await query('SELECT id FROM medicamentos WHERE id = $1', [data.medicamento_id]);
  if (med.rows.length === 0) {
    throw new AppError('Medicamento não encontrado', 404);
  }

  const result = await query(`
    INSERT INTO farmacia_estoque (farmacia_id, medicamento_id, quantidade, preco_farmacia)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (farmacia_id, medicamento_id) 
    DO UPDATE SET quantidade = farmacia_estoque.quantidade + $3, preco_farmacia = COALESCE($4, farmacia_estoque.preco_farmacia), updated_at = NOW()
    RETURNING *
  `, [farmaciaId, data.medicamento_id, data.quantidade, data.preco_farmacia || null]);

  res.status(201).json(result.rows[0]);
});

// PUT /farmacia/estoque/:id - Atualizar item do estoque
const updateEstoqueSchema = z.object({
  quantidade: z.number().int().min(0).optional(),
  preco_farmacia: z.number().positive().nullable().optional(),
});

router.put('/estoque/:id', authorize('farmacia_admin', 'admin'), async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;
  const { id } = req.params;
  const data = updateEstoqueSchema.parse(req.body);

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.quantidade !== undefined) {
    fields.push(`quantidade = $${paramIndex}`);
    values.push(data.quantidade);
    paramIndex++;
  }
  if (data.preco_farmacia !== undefined) {
    fields.push(`preco_farmacia = $${paramIndex}`);
    values.push(data.preco_farmacia);
    paramIndex++;
  }

  if (fields.length === 0) {
    throw new AppError('Nenhum campo para atualizar', 400);
  }

  fields.push('updated_at = NOW()');
  values.push(id, farmaciaId);

  const result = await query(
    `UPDATE farmacia_estoque SET ${fields.join(', ')} WHERE id = $${paramIndex} AND farmacia_id = $${paramIndex + 1} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('Item de estoque não encontrado', 404);
  }

  res.json(result.rows[0]);
});

// DELETE /farmacia/estoque/:id - Remover item do estoque
router.delete('/estoque/:id', authorize('farmacia_admin', 'admin'), async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;
  const { id } = req.params;

  const result = await query(
    'DELETE FROM farmacia_estoque WHERE id = $1 AND farmacia_id = $2 RETURNING id',
    [id, farmaciaId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Item de estoque não encontrado', 404);
  }

  res.json({ message: 'Item removido do estoque' });
});

// POST /farmacia/estoque/bulk - Atualização em massa do estoque
const bulkEstoqueSchema = z.object({
  items: z.array(z.object({
    medicamento_id: z.string().uuid(),
    quantidade: z.number().int().min(0),
    preco_farmacia: z.number().positive().optional(),
  }))
});

router.post('/estoque/bulk', authorize('farmacia_admin', 'admin'), async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;
  const { items } = bulkEstoqueSchema.parse(req.body);

  const results = await withTransaction(async (client) => {
    const updated: any[] = [];
    for (const item of items) {
      const result = await client.query(`
        INSERT INTO farmacia_estoque (farmacia_id, medicamento_id, quantidade, preco_farmacia)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (farmacia_id, medicamento_id)
        DO UPDATE SET quantidade = $3, preco_farmacia = COALESCE($4, farmacia_estoque.preco_farmacia), updated_at = NOW()
        RETURNING *
      `, [farmaciaId, item.medicamento_id, item.quantidade, item.preco_farmacia || null]);
      updated.push(result.rows[0]);
    }
    return updated;
  });

  res.json({ updated: results.length, items: results });
});

// ============================================
// GESTÃO DE PEDIDOS
// ============================================

// GET /farmacia/pedidos - Pedidos da farmácia
router.get('/pedidos', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;
  const { status, page = '1', limit = '20' } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  const conditions = ['p.farmacia_id = $1'];
  const params: any[] = [farmaciaId];
  let paramIndex = 2;

  if (status) {
    conditions.push(`p.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  const [pedidos, countResult] = await Promise.all([
    query(`
      SELECT 
        p.*,
        u.nome_completo as cliente_nome,
        u.telefone as cliente_telefone,
        (
          SELECT json_agg(json_build_object(
            'id', ip.id,
            'medicamento_id', ip.medicamento_id,
            'nome', m.nome,
            'quantidade', ip.quantidade,
            'preco_unitario', ip.preco_unitario,
            'subtotal', ip.subtotal
          ))
          FROM itens_pedido ip
          JOIN medicamentos m ON m.id = ip.medicamento_id
          WHERE ip.pedido_id = p.id
        ) as itens
      FROM pedidos p
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE ${whereClause}
      ORDER BY 
        CASE p.status 
          WHEN 'aguardando_farmacia' THEN 1 
          WHEN 'em_preparacao' THEN 2 
          WHEN 'pronto_entrega' THEN 3
          ELSE 4 
        END,
        p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, Number(limit), offset]),
    query(`
      SELECT COUNT(*) as total FROM pedidos p WHERE ${whereClause}
    `, params)
  ]);

  res.json({
    items: pedidos.rows,
    total: Number(countResult.rows[0].total),
    page: Number(page),
    limit: Number(limit)
  });
});

// GET /farmacia/pedidos/:id - Detalhes do pedido
router.get('/pedidos/:id', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;
  const { id } = req.params;

  const result = await query(`
    SELECT 
      p.*,
      u.nome_completo as cliente_nome,
      u.telefone as cliente_telefone,
      u.email as cliente_email,
      (
        SELECT json_agg(json_build_object(
          'id', ip.id,
          'medicamento_id', ip.medicamento_id,
          'nome', m.nome,
          'dosagem', m.dosagem,
          'forma_farmaceutica', m.forma_farmaceutica,
          'quantidade', ip.quantidade,
          'preco_unitario', ip.preco_unitario,
          'subtotal', ip.subtotal,
          'requer_receita', m.requer_receita
        ))
        FROM itens_pedido ip
        JOIN medicamentos m ON m.id = ip.medicamento_id
        WHERE ip.pedido_id = p.id
      ) as itens,
      (
        SELECT json_build_object(
          'id', e.id,
          'status', e.status,
          'motorista_nome', mot.nome_completo,
          'motorista_telefone', mot.telefone
        )
        FROM entregas e
        LEFT JOIN usuarios mot ON mot.id = e.motorista_id
        WHERE e.pedido_id = p.id
        LIMIT 1
      ) as entrega
    FROM pedidos p
    JOIN usuarios u ON u.id = p.usuario_id
    WHERE p.id = $1 AND p.farmacia_id = $2
  `, [id, farmaciaId]);

  if (result.rows.length === 0) {
    throw new AppError('Pedido não encontrado', 404);
  }

  res.json(result.rows[0]);
});

// PUT /farmacia/pedidos/:id/aceitar - Aceitar pedido
router.put('/pedidos/:id/aceitar', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;
  const { id } = req.params;

  const result = await withTransaction(async (client) => {
    // Verificar se pedido pertence a esta farmácia e está aguardando
    const pedido = await client.query(
      `SELECT id, status FROM pedidos WHERE id = $1 AND farmacia_id = $2`,
      [id, farmaciaId]
    );

    if (pedido.rows.length === 0) {
      throw new AppError('Pedido não encontrado', 404);
    }

    if (pedido.rows[0].status !== 'aguardando_farmacia') {
      throw new AppError('Pedido não está aguardando aceitação', 400);
    }

    // Atualizar status do pedido
    const updated = await client.query(
      `UPDATE pedidos SET status = 'em_preparacao', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    // Atualizar rodízio como aceito
    await client.query(
      `UPDATE fila_rodizio SET status = 'aceito', respondido_em = NOW() WHERE pedido_id = $1 AND farmacia_id = $2`,
      [id, farmaciaId]
    );

    // Atualizar último pedido recebido da farmácia
    await client.query(
      `UPDATE farmacias SET ultimo_pedido_recebido = NOW() WHERE id = $1`,
      [farmaciaId]
    );

    return updated.rows[0];
  });

  res.json(result);
});

// PUT /farmacia/pedidos/:id/recusar - Recusar pedido (rodízio passa para próxima farmácia)
router.put('/pedidos/:id/recusar', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;
  const { id } = req.params;
  const { motivo } = z.object({ motivo: z.string().min(5) }).parse(req.body);

  const result = await withTransaction(async (client) => {
    // Verificar pedido
    const pedido = await client.query(
      `SELECT id, status FROM pedidos WHERE id = $1 AND farmacia_id = $2`,
      [id, farmaciaId]
    );

    if (pedido.rows.length === 0) {
      throw new AppError('Pedido não encontrado', 404);
    }

    // Marcar recusa no rodízio
    await client.query(
      `UPDATE fila_rodizio SET status = 'recusado', respondido_em = NOW(), motivo_recusa = $3 
       WHERE pedido_id = $1 AND farmacia_id = $2`,
      [id, farmaciaId, motivo]
    );

    // Incrementar penalidade da farmácia
    await client.query(
      `UPDATE farmacias SET penalidade_rodizio = penalidade_rodizio + 1 WHERE id = $1`,
      [farmaciaId]
    );

    // Encontrar próxima farmácia na fila
    const proxima = await client.query(`
      SELECT fr.id, fr.farmacia_id, f.nome as farmacia_nome
      FROM fila_rodizio fr
      JOIN farmacias f ON f.id = fr.farmacia_id
      WHERE fr.pedido_id = $1 AND fr.status = 'pendente'
      ORDER BY fr.posicao ASC
      LIMIT 1
    `, [id]);

    if (proxima.rows.length > 0) {
      // Atribuir pedido à próxima farmácia
      await client.query(
        `UPDATE pedidos SET farmacia_id = $1, updated_at = NOW() WHERE id = $2`,
        [proxima.rows[0].farmacia_id, id]
      );

      // Marcar como enviado
      await client.query(
        `UPDATE fila_rodizio SET status = 'enviado', enviado_em = NOW() WHERE id = $1`,
        [proxima.rows[0].id]
      );

      return { 
        message: 'Pedido recusado. Encaminhado para próxima farmácia.',
        proxima_farmacia: proxima.rows[0].farmacia_nome
      };
    } else {
      // Nenhuma farmácia disponível — pedido volta para pendente sem farmácia
      await client.query(
        `UPDATE pedidos SET farmacia_id = NULL, status = 'pendente', updated_at = NOW() WHERE id = $1`,
        [id]
      );

      return { 
        message: 'Pedido recusado. Nenhuma farmácia disponível na fila.',
        proxima_farmacia: null
      };
    }
  });

  res.json(result);
});

// PUT /farmacia/pedidos/:id/pronto - Marcar pedido como pronto para entrega
router.put('/pedidos/:id/pronto', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;
  const { id } = req.params;

  const pedido = await query(
    `SELECT id, status FROM pedidos WHERE id = $1 AND farmacia_id = $2`,
    [id, farmaciaId]
  );

  if (pedido.rows.length === 0) {
    throw new AppError('Pedido não encontrado', 404);
  }

  if (pedido.rows[0].status !== 'em_preparacao') {
    throw new AppError('Pedido não está em preparação', 400);
  }

  const result = await query(
    `UPDATE pedidos SET status = 'pronto_entrega', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );

  // TODO: Notificar sistema de transporte para buscar pedido
  // notifyEntity('transporte', transporteId, 'novo_pedido_pronto', result.rows[0]);

  res.json(result.rows[0]);
});

// ============================================
// RODÍZIO - Fila de pedidos
// ============================================

// GET /farmacia/rodizio - Ver fila do rodízio (pedidos aguardando resposta)
router.get('/rodizio', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;

  const result = await query(`
    SELECT 
      fr.*,
      p.numero_pedido,
      p.total,
      p.zona_entrega,
      p.endereco_entrega,
      u.nome_completo as cliente_nome,
      (
        SELECT json_agg(json_build_object(
          'nome', m.nome,
          'quantidade', ip.quantidade
        ))
        FROM itens_pedido ip
        JOIN medicamentos m ON m.id = ip.medicamento_id
        WHERE ip.pedido_id = p.id
      ) as itens
    FROM fila_rodizio fr
    JOIN pedidos p ON p.id = fr.pedido_id
    JOIN usuarios u ON u.id = p.usuario_id
    WHERE fr.farmacia_id = $1 AND fr.status IN ('pendente', 'enviado')
    ORDER BY fr.posicao ASC
  `, [farmaciaId]);

  res.json(result.rows);
});

// ============================================
// CATÁLOGO - Medicamentos disponíveis para adicionar
// ============================================

// GET /farmacia/catalogo - Buscar medicamentos no catálogo global
router.get('/catalogo', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;
  const { search, categoria, page = '1', limit = '20' } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(`(m.nome ILIKE $${paramIndex} OR m.principio_ativo ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (categoria) {
    conditions.push(`m.categoria = $${paramIndex}`);
    params.push(categoria);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(`
    SELECT 
      m.*,
      fe.quantidade as estoque_farmacia,
      fe.preco_farmacia
    FROM medicamentos m
    LEFT JOIN farmacia_estoque fe ON fe.medicamento_id = m.id AND fe.farmacia_id = $${paramIndex}
    ${whereClause}
    ORDER BY m.nome ASC
    LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
  `, [...params, farmaciaId, Number(limit), offset]);

  res.json(result.rows);
});

// ============================================
// FUNCIONÁRIOS
// ============================================

// GET /farmacia/funcionarios - Listar funcionários da farmácia
router.get('/funcionarios', authorize('farmacia_admin', 'admin'), async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;

  const result = await query(`
    SELECT id, nome_completo, email, telefone, tipo_usuario, status_conta, foto_perfil, created_at
    FROM usuarios 
    WHERE entidade_id = $1 AND entidade_tipo = 'farmacia' AND tipo_usuario = 'farmacia_funcionario'
    ORDER BY nome_completo ASC
  `, [farmaciaId]);

  res.json(result.rows);
});

// POST /farmacia/funcionarios - Convidar funcionário
const addFuncionarioSchema = z.object({
  nome_completo: z.string().min(3),
  email: z.string().email(),
  telefone: z.string().optional(),
});

router.post('/funcionarios', authorize('farmacia_admin', 'admin'), async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;
  const data = addFuncionarioSchema.parse(req.body);

  // Verificar se email já está em uso
  const existing = await query('SELECT id FROM usuarios WHERE email = $1', [data.email]);
  if (existing.rows.length > 0) {
    throw new AppError('Email já está em uso', 409);
  }

  const bcrypt = await import('bcryptjs');
  const senhaTemp = Math.random().toString(36).slice(-8);
  const senhaHash = await bcrypt.hash(senhaTemp, 10);

  const result = await query(`
    INSERT INTO usuarios (nome_completo, email, telefone, senha_hash, tipo_usuario, entidade_id, entidade_tipo, status_conta)
    VALUES ($1, $2, $3, $4, 'farmacia_funcionario', $5, 'farmacia', 'ativo')
    RETURNING id, nome_completo, email, telefone, tipo_usuario, status_conta, created_at
  `, [data.nome_completo, data.email, data.telefone || null, senhaHash, farmaciaId]);

  // TODO: Enviar email com senha temporária
  // await sendEmail(data.email, 'Convite FarmaDom', `Sua senha temporária: ${senhaTemp}`);

  res.status(201).json({
    ...result.rows[0],
    _senha_temporaria: senhaTemp // Incluído apenas na resposta de criação
  });
});

// DELETE /farmacia/funcionarios/:id - Remover funcionário
router.delete('/funcionarios/:id', authorize('farmacia_admin', 'admin'), async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;
  const { id } = req.params;

  const result = await query(
    `DELETE FROM usuarios WHERE id = $1 AND entidade_id = $2 AND tipo_usuario = 'farmacia_funcionario' RETURNING id`,
    [id, farmaciaId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Funcionário não encontrado', 404);
  }

  res.json({ message: 'Funcionário removido' });
});

// ============================================
// RELATÓRIOS
// ============================================

// GET /farmacia/relatorios/vendas - Relatório de vendas
router.get('/relatorios/vendas', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;
  const { periodo = '30' } = req.query;

  const result = await query(`
    SELECT 
      date_trunc('day', p.created_at) as data,
      COUNT(*) as total_pedidos,
      SUM(p.total) as faturamento,
      COUNT(*) FILTER (WHERE p.status = 'entregue') as concluidos,
      COUNT(*) FILTER (WHERE p.status = 'cancelado') as cancelados
    FROM pedidos p
    WHERE p.farmacia_id = $1 
      AND p.created_at >= CURRENT_DATE - ($2 || ' days')::INTERVAL
    GROUP BY date_trunc('day', p.created_at)
    ORDER BY data DESC
  `, [farmaciaId, periodo]);

  res.json(result.rows);
});

// GET /farmacia/relatorios/produtos-mais-vendidos - Top produtos
router.get('/relatorios/produtos-mais-vendidos', async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const farmaciaId = authReq.entidadeId;
  const { limit = '10' } = req.query;

  const result = await query(`
    SELECT 
      m.id,
      m.nome,
      m.categoria,
      SUM(ip.quantidade) as total_vendido,
      SUM(ip.subtotal) as receita_total
    FROM itens_pedido ip
    JOIN pedidos p ON p.id = ip.pedido_id
    JOIN medicamentos m ON m.id = ip.medicamento_id
    WHERE p.farmacia_id = $1 AND p.status = 'entregue'
    GROUP BY m.id, m.nome, m.categoria
    ORDER BY total_vendido DESC
    LIMIT $2
  `, [farmaciaId, Number(limit)]);

  res.json(result.rows);
});

export default router;
