import { Router, Response } from 'express';
import { query, withTransaction } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// POST /api/v1/pedidos - Criar novo pedido
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await withTransaction(async (client) => {
      const { itens, endereco_entrega, metodo_pagamento, observacoes, zona_entrega, parcelado, numero_parcelas } = req.body;

      if (!itens || itens.length === 0) {
        throw Object.assign(new Error('Pedido deve ter pelo menos um item'), { statusCode: 400 });
      }

      if (!endereco_entrega) {
        throw Object.assign(new Error('Endereço de entrega é obrigatório'), { statusCode: 400 });
      }

      // Calcular valor total
      let subtotal = 0;
      for (const item of itens) {
        subtotal += item.preco_unitario * item.quantidade;
      }

      const taxaEntrega = 0;
      const desconto = 0;
      const total = subtotal + taxaEntrega - desconto;

      // Gerar número do pedido
      const numeroPedido = `PED-${Date.now()}`;
      const pedidoId = crypto.randomUUID();

      // Criar pedido — status aguardando_farmacia para ativar rodízio
      await client.query(
        `INSERT INTO pedidos (id, usuario_id, numero_pedido, status, total, subtotal, taxa_entrega, desconto, metodo_pagamento, endereco_entrega, observacoes, zona_entrega, parcelado, numero_parcelas)
         VALUES ($1, $2, $3, 'aguardando_farmacia', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          pedidoId, req.user?.id, numeroPedido,
          total, subtotal, taxaEntrega, desconto,
          metodo_pagamento || 'a_definir', endereco_entrega,
          observacoes || null, zona_entrega || null,
          parcelado || false, numero_parcelas || 1,
        ]
      );

      // Inserir itens do pedido
      for (const item of itens) {
        const itemId = crypto.randomUUID();
        await client.query(
          `INSERT INTO itens_pedido (id, pedido_id, medicamento_id, quantidade, preco_unitario)
           VALUES ($1, $2, $3, $4, $5)`,
          [itemId, pedidoId, item.medicamento_id, item.quantidade, item.preco_unitario]
        );
      }

      // Buscar pedido criado
      const pedidoResult = await client.query(
        'SELECT * FROM pedidos WHERE id = $1',
        [pedidoId]
      );

      return pedidoResult.rows[0];
    });

    res.status(201).json(result);
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Create pedido error:', error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// GET /api/v1/pedidos - Listar pedidos do usuário
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT p.*, f.nome as farmacia_nome 
       FROM pedidos p
       LEFT JOIN farmacias f ON p.farmacia_id = f.id
       WHERE p.usuario_id = $1 ORDER BY p.created_at DESC`,
      [req.user?.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('List pedidos error:', error);
    res.status(500).json({ error: 'Erro ao listar pedidos' });
  }
});

// GET /api/v1/pedidos/:id - Buscar pedido por ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const pedidoResult = await query(
      `SELECT p.*, f.nome as farmacia_nome
       FROM pedidos p
       LEFT JOIN farmacias f ON p.farmacia_id = f.id
       WHERE p.id = $1 AND p.usuario_id = $2`,
      [req.params.id, req.user?.id]
    );

    if (pedidoResult.rows.length === 0) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    // Buscar itens do pedido
    const itensResult = await query(
      `SELECT ip.*, m.nome as medicamento_nome 
       FROM itens_pedido ip
       JOIN medicamentos m ON ip.medicamento_id = m.id
       WHERE ip.pedido_id = $1`,
      [req.params.id]
    );

    res.json({
      ...pedidoResult.rows[0],
      itens: itensResult.rows,
    });
  } catch (error) {
    console.error('Get pedido error:', error);
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
});

// PUT /api/v1/pedidos/:id/cancelar - Cancelar pedido
router.put('/:id/cancelar', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `UPDATE pedidos SET status = 'cancelado', updated_at = NOW()
       WHERE id = $1 AND usuario_id = $2 AND status IN ('pendente', 'aguardando_farmacia')
       RETURNING id`,
      [req.params.id, req.user?.id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Pedido não encontrado ou não pode ser cancelado' });
      return;
    }

    res.json({ message: 'Pedido cancelado com sucesso' });
  } catch (error) {
    console.error('Cancel pedido error:', error);
    res.status(500).json({ error: 'Erro ao cancelar pedido' });
  }
});

export default router;
