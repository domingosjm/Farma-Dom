import { Router, Response } from 'express';
import { query, withTransaction } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/v1/pacotes - Listar todos os pacotes
router.get('/', async (req, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM pacotes_saude WHERE is_ativo = true ORDER BY preco_mensal'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List pacotes error:', error);
    res.status(500).json({ error: 'Erro ao listar pacotes' });
  }
});

// GET /api/v1/pacotes/:id
router.get('/:id', async (req, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM pacotes_saude WHERE id = $1 AND is_ativo = true',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Pacote não encontrado' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get pacote error:', error);
    res.status(500).json({ error: 'Erro ao buscar pacote' });
  }
});

// GET /api/v1/pacotes/user/assinaturas
router.get('/user/assinaturas', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT a.*, 
              p.nome as pacote_nome,
              p.descricao as pacote_descricao,
              p.preco_mensal,
              p.tipo,
              p.beneficios
       FROM assinaturas_pacotes a
       JOIN pacotes_saude p ON a.pacote_id = p.id
       WHERE a.usuario_id = $1
       ORDER BY a.created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user subscriptions error:', error);
    res.status(500).json({ error: 'Erro ao buscar assinaturas' });
  }
});

// GET /api/v1/pacotes/user/assinatura-ativa
router.get('/user/assinatura-ativa', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT a.*, 
              p.nome as pacote_nome,
              p.descricao as pacote_descricao,
              p.preco_mensal,
              p.tipo,
              p.beneficios,
              p.limite_consultas,
              p.desconto_medicamentos
       FROM assinaturas_pacotes a
       JOIN pacotes_saude p ON a.pacote_id = p.id
       WHERE a.usuario_id = $1 AND a.status = 'ativa'
       ORDER BY a.data_inicio DESC
       LIMIT 1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      res.json(null);
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get active subscription error:', error);
    res.status(500).json({ error: 'Erro ao buscar assinatura ativa' });
  }
});

// POST /api/v1/pacotes/:id/assinar
router.post('/:id/assinar', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const resultado = await withTransaction(async (client) => {
      // Verificar se pacote existe
      const pacoteResult = await client.query(
        'SELECT * FROM pacotes_saude WHERE id = $1 AND is_ativo = true',
        [req.params.id]
      );

      if (pacoteResult.rows.length === 0) {
        throw Object.assign(new Error('Pacote não encontrado'), { statusCode: 404 });
      }

      const pacote = pacoteResult.rows[0];

      // Verificar se já tem assinatura ativa
      const ativaResult = await client.query(
        "SELECT * FROM assinaturas_pacotes WHERE usuario_id = $1 AND status = 'ativa'",
        [req.userId]
      );

      if (ativaResult.rows.length > 0) {
        throw Object.assign(new Error('Você já possui uma assinatura ativa'), { statusCode: 400 });
      }

      const { metodo_pagamento } = req.body;

      if (!metodo_pagamento) {
        throw Object.assign(new Error('Método de pagamento é obrigatório'), { statusCode: 400 });
      }

      // Criar assinatura
      const assinaturaId = crypto.randomUUID();
      const dataInicio = new Date();
      const dataFim = new Date(dataInicio);
      dataFim.setMonth(dataFim.getMonth() + (pacote.duracao_meses || 1));

      await client.query(
        `INSERT INTO assinaturas_pacotes (id, usuario_id, pacote_id, data_inicio, data_fim, status, valor_pago, metodo_pagamento)
         VALUES ($1, $2, $3, $4, $5, 'ativa', $6, $7)`,
        [assinaturaId, req.userId, req.params.id, dataInicio, dataFim, pacote.preco_mensal, metodo_pagamento]
      );

      // Criar registro de pagamento (simulado)
      const pagamentoId = crypto.randomUUID();
      const numeroPagamento = `PAG-${Date.now()}`;

      await client.query(
        `INSERT INTO pagamentos_assinaturas (id, assinatura_id, usuario_id, pacote_id, valor, metodo_pagamento, status, referencia_pagamento, data_pagamento)
         VALUES ($1, $2, $3, $4, $5, $6, 'aprovado', $7, NOW())`,
        [pagamentoId, assinaturaId, req.userId, req.params.id, pacote.preco_mensal, metodo_pagamento, numeroPagamento]
      );

      return {
        message: 'Assinatura criada com sucesso',
        assinatura: {
          id: assinaturaId,
          pacote_nome: pacote.nome,
          data_inicio: dataInicio,
          data_fim: dataFim,
          status: 'ativa',
        },
        pagamento: {
          id: pagamentoId,
          numero: numeroPagamento,
          valor: pacote.preco_mensal,
          status: 'aprovado',
          metodo: metodo_pagamento,
        },
      };
    });

    res.status(201).json(resultado);
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Erro ao processar assinatura' });
  }
});

// PUT /api/v1/pacotes/assinaturas/:id/cancelar
router.put('/assinaturas/:id/cancelar', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const assinatura = await query(
      'SELECT * FROM assinaturas_pacotes WHERE id = $1 AND usuario_id = $2',
      [req.params.id, req.userId]
    );

    if (assinatura.rows.length === 0) {
      res.status(404).json({ error: 'Assinatura não encontrada' });
      return;
    }

    await query(
      "UPDATE assinaturas_pacotes SET status = 'cancelada', data_fim = NOW(), cancelado_em = NOW(), updated_at = NOW() WHERE id = $1",
      [req.params.id]
    );

    res.json({ message: 'Assinatura cancelada com sucesso' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Erro ao cancelar assinatura' });
  }
});

// GET /api/v1/pacotes/pagamentos/historico
router.get('/pagamentos/historico', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT p.*, ps.nome as pacote_nome, a.data_inicio, a.data_fim
       FROM pagamentos_assinaturas p
       LEFT JOIN pacotes_saude ps ON p.pacote_id = ps.id
       LEFT JOIN assinaturas_pacotes a ON p.assinatura_id = a.id
       WHERE p.usuario_id = $1
       ORDER BY p.created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de pagamentos' });
  }
});

// POST /api/v1/pacotes/assinaturas/:id/upgrade
router.post('/assinaturas/:id/upgrade', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const resultado = await withTransaction(async (client) => {
      const { novo_pacote_id, metodo_pagamento } = req.body;

      if (!novo_pacote_id || !metodo_pagamento) {
        throw Object.assign(new Error('Dados incompletos'), { statusCode: 400 });
      }

      // Verificar assinatura atual
      const assinaturaResult = await client.query(
        "SELECT * FROM assinaturas_pacotes WHERE id = $1 AND usuario_id = $2 AND status = 'ativa'",
        [req.params.id, req.userId]
      );

      if (assinaturaResult.rows.length === 0) {
        throw Object.assign(new Error('Assinatura ativa não encontrada'), { statusCode: 404 });
      }

      // Verificar novo pacote
      const pacoteResult = await client.query(
        'SELECT * FROM pacotes_saude WHERE id = $1 AND is_ativo = true',
        [novo_pacote_id]
      );

      if (pacoteResult.rows.length === 0) {
        throw Object.assign(new Error('Pacote não encontrado'), { statusCode: 404 });
      }

      const novoPacote = pacoteResult.rows[0];

      // Cancelar assinatura atual
      await client.query(
        "UPDATE assinaturas_pacotes SET status = 'cancelada', data_fim = NOW(), cancelado_em = NOW() WHERE id = $1",
        [req.params.id]
      );

      // Criar nova assinatura
      const novaAssinaturaId = crypto.randomUUID();
      const dataInicio = new Date();
      const dataFim = new Date(dataInicio);
      dataFim.setMonth(dataFim.getMonth() + novoPacote.duracao_meses);

      await client.query(
        `INSERT INTO assinaturas_pacotes (id, usuario_id, pacote_id, data_inicio, data_fim, status, valor_pago, metodo_pagamento, proxima_cobranca)
         VALUES ($1, $2, $3, $4, $5, 'ativa', $6, $7, $5)`,
        [novaAssinaturaId, req.userId, novo_pacote_id, dataInicio, dataFim, novoPacote.preco_mensal, metodo_pagamento]
      );

      // Registrar pagamento
      const numeroPagamento = `PAG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      await client.query(
        `INSERT INTO pagamentos_assinaturas (id, assinatura_id, usuario_id, pacote_id, valor, metodo_pagamento, status, referencia_pagamento, data_pagamento)
         VALUES ($1, $2, $3, $4, $5, $6, 'aprovado', $7, NOW())`,
        [crypto.randomUUID(), novaAssinaturaId, req.userId, novo_pacote_id, novoPacote.preco_mensal, metodo_pagamento, numeroPagamento]
      );

      return {
        message: 'Plano alterado com sucesso',
        assinatura_id: novaAssinaturaId,
        pacote_nome: novoPacote.nome,
        proxima_cobranca: dataFim,
      };
    });

    res.json(resultado);
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Upgrade subscription error:', error);
    res.status(500).json({ error: 'Erro ao alterar plano' });
  }
});

// GET /api/v1/pacotes/uso/estatisticas
router.get('/uso/estatisticas', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const assinatura = await query(
      `SELECT a.*, p.nome as pacote_nome, p.limite_consultas, p.desconto_medicamentos
       FROM assinaturas_pacotes a
       LEFT JOIN pacotes_saude p ON a.pacote_id = p.id
       WHERE a.usuario_id = $1 AND a.status = 'ativa'
       LIMIT 1`,
      [req.userId]
    );

    if (assinatura.rows.length === 0) {
      res.json({ has_subscription: false });
      return;
    }

    const sub = assinatura.rows[0];

    // Contar consultas do mês atual
    const consultasMes = await query(
      `SELECT COUNT(*) as total 
       FROM consultas 
       WHERE paciente_id = $1 
       AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`,
      [req.userId]
    );

    // Contar pedidos do mês
    const pedidosMes = await query(
      `SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as valor_total
       FROM pedidos 
       WHERE usuario_id = $1 
       AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`,
      [req.userId]
    );

    const consultasUsadas = parseInt(consultasMes.rows[0].total) || 0;
    const consultasDisponiveis = sub.limite_consultas || 'Ilimitadas';
    const pedidosRealizados = parseInt(pedidosMes.rows[0].total) || 0;
    const economizado = pedidosMes.rows[0].valor_total
      ? (parseFloat(pedidosMes.rows[0].valor_total) * (sub.desconto_medicamentos / 100))
      : 0;

    res.json({
      has_subscription: true,
      pacote_nome: sub.pacote_nome,
      data_inicio: sub.data_inicio,
      data_fim: sub.data_fim,
      status: sub.status,
      consultas: {
        usadas: consultasUsadas,
        disponiveis: consultasDisponiveis,
        percentual: consultasDisponiveis === 'Ilimitadas'
          ? 0
          : (consultasUsadas / consultasDisponiveis) * 100,
      },
      medicamentos: {
        pedidos: pedidosRealizados,
        desconto: sub.desconto_medicamentos,
        economizado: economizado,
      },
    });
  } catch (error) {
    console.error('Get usage stats error:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas de uso' });
  }
});

export default router;
