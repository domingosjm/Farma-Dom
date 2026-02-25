import { Router, Response } from 'express';
import { query, withTransaction } from '../config/database';
import { authenticateToken, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * RODÍZIO INTELIGENTE — Distribuição justa de pedidos entre farmácias
 * 
 * Algoritmo:
 * 1. Quando um pedido é criado com zona_entrega, busca farmácias da mesma zona
 * 2. Ordena farmácias por:
 *    a) Menor penalidade (recusas)
 *    b) Mais antigo ultimo_pedido_recebido (round-robin)
 *    c) Está online
 * 3. Cria fila_rodizio com posições 1..N
 * 4. Atribui pedido à farmácia posição 1
 * 5. Se farmácia recusar, passa para posição 2 (via farmacia route)
 */

// POST /rodizio/distribuir/:pedidoId — Inicia distribuição por rodízio
router.post('/distribuir/:pedidoId', authenticateToken, authorize('admin', 'paciente'), async (req, res: Response) => {
  const { pedidoId } = req.params;

  const result = await withTransaction(async (client) => {
    // Get the order
    const pedido = await client.query(
      `SELECT id, zona_entrega, farmacia_id, status FROM pedidos WHERE id = $1`,
      [pedidoId]
    );

    if (pedido.rows.length === 0) {
      throw new AppError('Pedido não encontrado', 404);
    }

    const order = pedido.rows[0];

    if (order.farmacia_id) {
      throw new AppError('Pedido já foi atribuído a uma farmácia', 400);
    }

    // Get items to check if pharmacies have them in stock
    const itens = await client.query(
      `SELECT medicamento_id, quantidade FROM itens_pedido WHERE pedido_id = $1`,
      [pedidoId]
    );

    const medicamentoIds = itens.rows.map((i: any) => i.medicamento_id);

    // Find eligible pharmacies in the same zone
    let farmaciasQuery: string;
    let farmaciasParams: any[];

    if (order.zona_entrega) {
      // Prefer same zone, then others
      farmaciasQuery = `
        SELECT 
          f.id,
          f.nome,
          f.zona,
          f.penalidade_rodizio,
          f.ultimo_pedido_recebido,
          CASE WHEN f.zona = $2 THEN 0 ELSE 1 END as zona_priority,
          (
            SELECT COUNT(DISTINCT fe.medicamento_id) 
            FROM farmacia_estoque fe 
            WHERE fe.farmacia_id = f.id 
              AND fe.medicamento_id = ANY($3)
              AND fe.quantidade > 0
          ) as produtos_disponiveis
        FROM farmacias f
        WHERE f.is_online = true AND f.is_ativa = true
        HAVING (
          SELECT COUNT(DISTINCT fe.medicamento_id) 
          FROM farmacia_estoque fe 
          WHERE fe.farmacia_id = f.id 
            AND fe.medicamento_id = ANY($3)
            AND fe.quantidade > 0
        ) > 0
        ORDER BY 
          zona_priority ASC,
          produtos_disponiveis DESC,
          f.penalidade_rodizio ASC,
          f.ultimo_pedido_recebido ASC NULLS FIRST
        LIMIT 10
      `;
      farmaciasParams = [pedidoId, order.zona_entrega, medicamentoIds];
    } else {
      farmaciasQuery = `
        SELECT 
          f.id,
          f.nome,
          f.zona,
          f.penalidade_rodizio,
          f.ultimo_pedido_recebido,
          (
            SELECT COUNT(DISTINCT fe.medicamento_id) 
            FROM farmacia_estoque fe 
            WHERE fe.farmacia_id = f.id 
              AND fe.medicamento_id = ANY($2)
              AND fe.quantidade > 0
          ) as produtos_disponiveis
        FROM farmacias f
        WHERE f.is_online = true AND f.is_ativa = true
        HAVING (
          SELECT COUNT(DISTINCT fe.medicamento_id) 
          FROM farmacia_estoque fe 
          WHERE fe.farmacia_id = f.id 
            AND fe.medicamento_id = ANY($2)
            AND fe.quantidade > 0
        ) > 0
        ORDER BY 
          produtos_disponiveis DESC,
          f.penalidade_rodizio ASC,
          f.ultimo_pedido_recebido ASC NULLS FIRST
        LIMIT 10
      `;
      farmaciasParams = [pedidoId, medicamentoIds];
    }

    // The query might have issues with HAVING on non-aggregated fields
    // Use a subquery approach instead
    const farmacias = await client.query(`
      SELECT * FROM (
        SELECT 
          f.id,
          f.nome,
          f.zona,
          f.penalidade_rodizio,
          f.ultimo_pedido_recebido,
          ${order.zona_entrega ? `CASE WHEN f.zona = $2 THEN 0 ELSE 1 END as zona_priority,` : ''}
          (
            SELECT COUNT(DISTINCT fe.medicamento_id) 
            FROM farmacia_estoque fe 
            WHERE fe.farmacia_id = f.id 
              AND fe.medicamento_id = ANY($${order.zona_entrega ? 3 : 2})
              AND fe.quantidade > 0
          ) as produtos_disponiveis
        FROM farmacias f
        WHERE f.is_online = true AND f.is_ativa = true
      ) sub
      WHERE sub.produtos_disponiveis > 0
      ORDER BY 
        ${order.zona_entrega ? 'sub.zona_priority ASC,' : ''}
        sub.produtos_disponiveis DESC,
        sub.penalidade_rodizio ASC,
        sub.ultimo_pedido_recebido ASC NULLS FIRST
      LIMIT 10
    `, order.zona_entrega ? [pedidoId, order.zona_entrega, medicamentoIds] : [pedidoId, medicamentoIds]);

    if (farmacias.rows.length === 0) {
      throw new AppError('Nenhuma farmácia disponível com os produtos em estoque', 404);
    }

    // Create the rodizio queue
    for (let i = 0; i < farmacias.rows.length; i++) {
      const farm = farmacias.rows[i];
      await client.query(`
        INSERT INTO fila_rodizio (pedido_id, farmacia_id, posicao, status, enviado_em)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        pedidoId, 
        farm.id, 
        i + 1, 
        i === 0 ? 'enviado' : 'pendente',
        i === 0 ? new Date() : null
      ]);
    }

    // Assign to first pharmacy
    const firstFarmacia = farmacias.rows[0];
    await client.query(`
      UPDATE pedidos 
      SET farmacia_id = $1, status = 'aguardando_farmacia', updated_at = NOW()
      WHERE id = $2
    `, [firstFarmacia.id, pedidoId]);

    return {
      pedido_id: pedidoId,
      farmacia_atribuida: {
        id: firstFarmacia.id,
        nome: firstFarmacia.nome,
        zona: firstFarmacia.zona
      },
      fila_total: farmacias.rows.length,
      farmacias_na_fila: farmacias.rows.map((f: any, i: number) => ({
        posicao: i + 1,
        farmacia_id: f.id,
        farmacia_nome: f.nome,
        produtos_disponiveis: Number(f.produtos_disponiveis),
        penalidade: f.penalidade_rodizio
      }))
    };
  });

  res.json(result);
});

// GET /rodizio/status/:pedidoId — Status do rodízio de um pedido
router.get('/status/:pedidoId', authenticateToken, async (req, res: Response) => {
  const { pedidoId } = req.params;

  const result = await query(`
    SELECT 
      fr.*,
      f.nome as farmacia_nome,
      f.zona as farmacia_zona
    FROM fila_rodizio fr
    JOIN farmacias f ON f.id = fr.farmacia_id
    WHERE fr.pedido_id = $1
    ORDER BY fr.posicao ASC
  `, [pedidoId]);

  const pedido = await query(
    `SELECT id, numero_pedido, status, farmacia_id FROM pedidos WHERE id = $1`,
    [pedidoId]
  );

  res.json({
    pedido: pedido.rows[0] || null,
    fila: result.rows
  });
});

// GET /rodizio/config — Configurações do rodízio (admin)
router.get('/config', authenticateToken, authorize('admin'), async (req, res: Response) => {
  const result = await query(`
    SELECT * FROM rodizio_config ORDER BY zona
  `);

  res.json(result.rows);
});

export default router;
