import { Router, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Aplicar autenticação e verificação de admin em todas as rotas
router.use(authenticateToken);
router.use(authorize('admin'));

// GET /api/v1/admin/stats - Estatísticas gerais
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsuarios,
      usuariosAtivos,
      totalConsultas,
      consultasHoje,
      totalPedidos,
      receitaTotal,
      totalFarmacias,
      totalHospitais,
      totalTransportes,
      pendentesAprovacao,
      farmaciasPendentes,
      hospitaisPendentes,
      transportesPendentes,
    ] = await Promise.all([
      query('SELECT COUNT(*) as total FROM usuarios'),
      query('SELECT COUNT(*) as total FROM usuarios WHERE is_ativo = true'),
      query('SELECT COUNT(*) as total FROM consultas'),
      query("SELECT COUNT(*) as total FROM consultas WHERE DATE(created_at) = CURRENT_DATE"),
      query('SELECT COUNT(*) as total FROM pedidos'),
      query("SELECT COALESCE(SUM(total), 0) as total FROM pedidos WHERE status = 'entregue'"),
      query('SELECT COUNT(*) as total FROM farmacias'),
      query('SELECT COUNT(*) as total FROM hospitais'),
      query('SELECT COUNT(*) as total FROM empresas_transporte'),
      query("SELECT COUNT(*) as total FROM usuarios WHERE status_conta = 'pendente_aprovacao'"),
      query('SELECT COUNT(*) as total FROM farmacias WHERE aprovada = false'),
      query('SELECT COUNT(*) as total FROM hospitais WHERE aprovada = false'),
      query('SELECT COUNT(*) as total FROM empresas_transporte WHERE aprovada = false'),
    ]);

    res.json({
      total_usuarios: parseInt(totalUsuarios.rows[0].total),
      usuarios_ativos: parseInt(usuariosAtivos.rows[0].total),
      total_consultas: parseInt(totalConsultas.rows[0].total),
      consultas_hoje: parseInt(consultasHoje.rows[0].total),
      total_pedidos: parseInt(totalPedidos.rows[0].total),
      receita_total: parseFloat(receitaTotal.rows[0].total || '0'),
      total_farmacias: parseInt(totalFarmacias.rows[0].total),
      total_hospitais: parseInt(totalHospitais.rows[0].total),
      total_transportes: parseInt(totalTransportes.rows[0].total),
      pendentes_aprovacao: parseInt(pendentesAprovacao.rows[0].total),
      farmacias_pendentes: parseInt(farmaciasPendentes.rows[0].total),
      hospitais_pendentes: parseInt(hospitaisPendentes.rows[0].total),
      transportes_pendentes: parseInt(transportesPendentes.rows[0].total),
      total_pendentes: parseInt(pendentesAprovacao.rows[0].total) + 
                       parseInt(farmaciasPendentes.rows[0].total) + 
                       parseInt(hospitaisPendentes.rows[0].total) + 
                       parseInt(transportesPendentes.rows[0].total)
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// GET /api/v1/admin/usuarios - Listar todos os usuários
router.get('/usuarios', async (req: AuthRequest, res: Response) => {
  try {
    const { tipo, search, status_conta, limit = '50', offset = '0' } = req.query;

    let sql = `SELECT id, nome_completo, email, telefone, tipo_usuario, is_ativo, status_conta, 
                      entidade_id, entidade_tipo, created_at 
               FROM usuarios WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (tipo) {
      sql += ` AND tipo_usuario = $${paramIndex++}`;
      params.push(tipo);
    }

    if (status_conta) {
      sql += ` AND status_conta = $${paramIndex++}`;
      params.push(status_conta);
    }

    if (search) {
      sql += ` AND (nome_completo ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// GET /api/v1/admin/usuarios/:id
router.get('/usuarios/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT id, nome_completo, email, telefone, tipo_usuario, nif, data_nascimento, genero,
              foto_perfil, endereco_completo, cidade, provincia, is_ativo, status_conta,
              entidade_id, entidade_tipo, created_at 
       FROM usuarios WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// PUT /api/v1/admin/usuarios/:id
router.put('/usuarios/:id', async (req: AuthRequest, res: Response) => {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'nome_completo', 'email', 'telefone', 'tipo_usuario', 'is_ativo',
      'nif', 'data_nascimento', 'genero', 'endereco_completo', 'cidade',
      'provincia', 'status_conta',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        values.push(req.body[field]);
      }
    });

    if (updates.length === 0) {
      res.status(400).json({ error: 'Nenhum campo para atualizar' });
      return;
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.params.id);

    await query(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    const result = await query(
      `SELECT id, nome_completo, email, telefone, tipo_usuario, is_ativo, status_conta 
       FROM usuarios WHERE id = $1`,
      [req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// POST /api/v1/admin/usuarios/:id/aprovar
router.post('/usuarios/:id/aprovar', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      "UPDATE usuarios SET status_conta = 'aprovada', updated_at = NOW() WHERE id = $1 RETURNING id, nome_completo, tipo_usuario, status_conta",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    // Log de auditoria
    await query(
      `INSERT INTO logs_auditoria (id, usuario_id, acao, detalhes, ip_address)
       VALUES (gen_random_uuid(), $1, 'aprovar_conta', $2, $3)`,
      [req.userId, JSON.stringify({ usuario_aprovado: req.params.id }), req.ip]
    );

    res.json({ message: 'Conta aprovada com sucesso', usuario: result.rows[0] });
  } catch (error) {
    console.error('Aprovar usuario error:', error);
    res.status(500).json({ error: 'Erro ao aprovar conta' });
  }
});

// POST /api/v1/admin/usuarios/:id/rejeitar
router.post('/usuarios/:id/rejeitar', async (req: AuthRequest, res: Response) => {
  try {
    const { motivo } = req.body;

    const result = await query(
      "UPDATE usuarios SET status_conta = 'rejeitada', updated_at = NOW() WHERE id = $1 RETURNING id, nome_completo, tipo_usuario, status_conta",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    await query(
      `INSERT INTO logs_auditoria (id, usuario_id, acao, detalhes, ip_address)
       VALUES (gen_random_uuid(), $1, 'rejeitar_conta', $2, $3)`,
      [req.userId, JSON.stringify({ usuario_rejeitado: req.params.id, motivo }), req.ip]
    );

    res.json({ message: 'Conta rejeitada', usuario: result.rows[0] });
  } catch (error) {
    console.error('Rejeitar usuario error:', error);
    res.status(500).json({ error: 'Erro ao rejeitar conta' });
  }
});

// DELETE /api/v1/admin/usuarios/:id
router.delete('/usuarios/:id', async (req: AuthRequest, res: Response) => {
  try {
    await query(
      'UPDATE usuarios SET is_ativo = false, updated_at = NOW() WHERE id = $1',
      [req.params.id]
    );
    res.json({ message: 'Usuário desativado com sucesso' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Erro ao desativar usuário' });
  }
});

// GET /api/v1/admin/farmacias
router.get('/farmacias', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT f.*, 
              (SELECT COUNT(*) FROM farmacia_estoque fe WHERE fe.farmacia_id = f.id) as total_produtos,
              (SELECT COUNT(*) FROM pedidos p WHERE p.farmacia_id = f.id) as total_pedidos
       FROM farmacias f
       ORDER BY f.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List farmacias error:', error);
    res.status(500).json({ error: 'Erro ao listar farmácias' });
  }
});

// GET /api/v1/admin/hospitais
router.get('/hospitais', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT h.*,
              (SELECT COUNT(*) FROM medicos_hospitais mh WHERE mh.hospital_id = h.id) as total_medicos
       FROM hospitais h
       ORDER BY h.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List hospitais error:', error);
    res.status(500).json({ error: 'Erro ao listar hospitais' });
  }
});

// GET /api/v1/admin/consultas
router.get('/consultas', async (req: AuthRequest, res: Response) => {
  try {
    const { status, data_inicio, data_fim, limit = '50', offset = '0' } = req.query;

    let sql = `
      SELECT c.*, 
             u.nome_completo as paciente_nome,
             u.email as paciente_email,
             h.nome as hospital_nome
      FROM consultas c
      JOIN usuarios u ON c.paciente_id = u.id
      LEFT JOIN hospitais h ON c.hospital_id = h.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

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

    sql += ` ORDER BY c.data_hora_agendada DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('List consultas error:', error);
    res.status(500).json({ error: 'Erro ao listar consultas' });
  }
});

// GET /api/v1/admin/pedidos
router.get('/pedidos', async (req: AuthRequest, res: Response) => {
  try {
    const { status, limit = '50', offset = '0' } = req.query;

    let sql = `
      SELECT p.*, 
             u.nome_completo as usuario_nome,
             u.email as usuario_email,
             f.nome as farmacia_nome
      FROM pedidos p
      JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN farmacias f ON p.farmacia_id = f.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND p.status = $${paramIndex++}`;
      params.push(status);
    }

    sql += ` ORDER BY p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('List pedidos error:', error);
    res.status(500).json({ error: 'Erro ao listar pedidos' });
  }
});

// PUT /api/v1/admin/pedidos/:id/status
router.put('/pedidos/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Status é obrigatório' });
      return;
    }

    await query(
      'UPDATE pedidos SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, req.params.id]
    );

    const result = await query('SELECT * FROM pedidos WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update pedido status error:', error);
    res.status(500).json({ error: 'Erro ao atualizar status do pedido' });
  }
});

// GET /api/v1/admin/rodizio/config
router.get('/rodizio/config', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM rodizio_config WHERE id = 1');
    res.json(result.rows[0] || {});
  } catch (error) {
    console.error('Get rodizio config error:', error);
    res.status(500).json({ error: 'Erro ao buscar configuração do rodízio' });
  }
});

// PUT /api/v1/admin/rodizio/config
router.put('/rodizio/config', async (req: AuthRequest, res: Response) => {
  try {
    const { max_recusas_antes_penalidade, tempo_penalidade_minutos, tempo_resposta_segundos, raio_busca_km } = req.body;

    await query(
      `UPDATE rodizio_config 
       SET max_recusas_antes_penalidade = COALESCE($1, max_recusas_antes_penalidade),
           tempo_penalidade_minutos = COALESCE($2, tempo_penalidade_minutos),
           tempo_resposta_segundos = COALESCE($3, tempo_resposta_segundos),
           raio_busca_km = COALESCE($4, raio_busca_km),
           updated_at = NOW()
       WHERE id = 1`,
      [max_recusas_antes_penalidade, tempo_penalidade_minutos, tempo_resposta_segundos, raio_busca_km]
    );

    const result = await query('SELECT * FROM rodizio_config WHERE id = 1');
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update rodizio config error:', error);
    res.status(500).json({ error: 'Erro ao atualizar configuração do rodízio' });
  }
});

// GET /api/v1/admin/comissoes
router.get('/comissoes', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM comissoes_config ORDER BY tipo_servico');
    res.json(result.rows);
  } catch (error) {
    console.error('Get comissoes error:', error);
    res.status(500).json({ error: 'Erro ao buscar comissões' });
  }
});

// ============================================
// ROTAS DE APROVAÇÃO DE ENTIDADES
// ============================================

// GET /api/v1/admin/aprovacoes/pendentes - Listar todas as entidades pendentes
router.get('/aprovacoes/pendentes', async (req: AuthRequest, res: Response) => {
  try {
    const [farmacias, hospitais, transportes, usuarios] = await Promise.all([
      query(`SELECT id, nome, endereco, cidade, provincia, telefone, email, licenca, created_at, 'farmacia' as tipo_entidade 
             FROM farmacias WHERE aprovada = false ORDER BY created_at DESC`),
      query(`SELECT id, nome, endereco, cidade, provincia, telefone, email, licenca, tipo, created_at, 'hospital' as tipo_entidade 
             FROM hospitais WHERE aprovada = false ORDER BY created_at DESC`),
      query(`SELECT id, nome, endereco, cidade, provincia, telefone, email, cnpj, created_at, 'transporte' as tipo_entidade 
             FROM empresas_transporte WHERE aprovada = false ORDER BY created_at DESC`),
      query(`SELECT id, nome_completo, email, telefone, tipo_usuario, created_at, 'usuario' as tipo_entidade 
             FROM usuarios WHERE status_conta = 'pendente_aprovacao' ORDER BY created_at DESC`)
    ]);

    res.json({
      farmacias: farmacias.rows,
      hospitais: hospitais.rows,
      transportes: transportes.rows,
      usuarios: usuarios.rows,
      total: farmacias.rows.length + hospitais.rows.length + transportes.rows.length + usuarios.rows.length
    });
  } catch (error) {
    console.error('Get aprovacoes pendentes error:', error);
    res.status(500).json({ error: 'Erro ao buscar aprovações pendentes' });
  }
});

// POST /api/v1/admin/farmacias/:id/aprovar
router.post('/farmacias/:id/aprovar', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `UPDATE farmacias SET aprovada = true, updated_at = NOW() WHERE id = ? RETURNING id, nome`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Farmácia não encontrada' });
      return;
    }

    // Aprovar também o usuário admin da farmácia se existir
    await query(
      `UPDATE usuarios SET status_conta = 'ativo' WHERE entidade_id = ? AND entidade_tipo = 'farmacia'`,
      [req.params.id]
    );

    // Log de auditoria
    await query(
      `INSERT INTO logs_auditoria (usuario_id, acao, detalhes, ip_address)
       VALUES (?, 'aprovar_farmacia', ?, ?)`,
      [req.userId, JSON.stringify({ farmacia_id: req.params.id }), req.ip]
    );

    res.json({ message: 'Farmácia aprovada com sucesso', farmacia: result.rows[0] });
  } catch (error) {
    console.error('Aprovar farmacia error:', error);
    res.status(500).json({ error: 'Erro ao aprovar farmácia' });
  }
});

// POST /api/v1/admin/farmacias/:id/rejeitar
router.post('/farmacias/:id/rejeitar', async (req: AuthRequest, res: Response) => {
  try {
    const { motivo } = req.body;

    // Podemos optar por deletar ou manter com flag de rejeitada
    const result = await query(
      `UPDATE farmacias SET is_ativa = false, updated_at = NOW() WHERE id = ? RETURNING id, nome`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Farmácia não encontrada' });
      return;
    }

    // Rejeitar também o usuário admin da farmácia se existir
    await query(
      `UPDATE usuarios SET status_conta = 'rejeitada' WHERE entidade_id = ? AND entidade_tipo = 'farmacia'`,
      [req.params.id]
    );

    await query(
      `INSERT INTO logs_auditoria (usuario_id, acao, detalhes, ip_address)
       VALUES (?, 'rejeitar_farmacia', ?, ?)`,
      [req.userId, JSON.stringify({ farmacia_id: req.params.id, motivo }), req.ip]
    );

    res.json({ message: 'Farmácia rejeitada', farmacia: result.rows[0] });
  } catch (error) {
    console.error('Rejeitar farmacia error:', error);
    res.status(500).json({ error: 'Erro ao rejeitar farmácia' });
  }
});

// POST /api/v1/admin/hospitais/:id/aprovar
router.post('/hospitais/:id/aprovar', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `UPDATE hospitais SET aprovada = true, updated_at = NOW() WHERE id = ? RETURNING id, nome`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Hospital não encontrado' });
      return;
    }

    // Aprovar também o usuário gerente do hospital se existir
    await query(
      `UPDATE usuarios SET status_conta = 'ativo' WHERE entidade_id = ? AND entidade_tipo = 'hospital'`,
      [req.params.id]
    );

    await query(
      `INSERT INTO logs_auditoria (usuario_id, acao, detalhes, ip_address)
       VALUES (?, 'aprovar_hospital', ?, ?)`,
      [req.userId, JSON.stringify({ hospital_id: req.params.id }), req.ip]
    );

    res.json({ message: 'Hospital aprovado com sucesso', hospital: result.rows[0] });
  } catch (error) {
    console.error('Aprovar hospital error:', error);
    res.status(500).json({ error: 'Erro ao aprovar hospital' });
  }
});

// POST /api/v1/admin/hospitais/:id/rejeitar
router.post('/hospitais/:id/rejeitar', async (req: AuthRequest, res: Response) => {
  try {
    const { motivo } = req.body;

    const result = await query(
      `UPDATE hospitais SET aprovada = false, updated_at = NOW() WHERE id = ? RETURNING id, nome`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Hospital não encontrado' });
      return;
    }

    await query(
      `UPDATE usuarios SET status_conta = 'rejeitada' WHERE entidade_id = ? AND entidade_tipo = 'hospital'`,
      [req.params.id]
    );

    await query(
      `INSERT INTO logs_auditoria (usuario_id, acao, detalhes, ip_address)
       VALUES (?, 'rejeitar_hospital', ?, ?)`,
      [req.userId, JSON.stringify({ hospital_id: req.params.id, motivo }), req.ip]
    );

    res.json({ message: 'Hospital rejeitado', hospital: result.rows[0] });
  } catch (error) {
    console.error('Rejeitar hospital error:', error);
    res.status(500).json({ error: 'Erro ao rejeitar hospital' });
  }
});

// POST /api/v1/admin/transportes/:id/aprovar
router.post('/transportes/:id/aprovar', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `UPDATE empresas_transporte SET aprovada = true, updated_at = NOW() WHERE id = ? RETURNING id, nome`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Empresa de transporte não encontrada' });
      return;
    }

    // Aprovar também o usuário gerente da empresa se existir
    await query(
      `UPDATE usuarios SET status_conta = 'ativo' WHERE entidade_id = ? AND entidade_tipo = 'empresa_transporte'`,
      [req.params.id]
    );

    await query(
      `INSERT INTO logs_auditoria (usuario_id, acao, detalhes, ip_address)
       VALUES (?, 'aprovar_transporte', ?, ?)`,
      [req.userId, JSON.stringify({ transporte_id: req.params.id }), req.ip]
    );

    res.json({ message: 'Empresa de transporte aprovada com sucesso', transporte: result.rows[0] });
  } catch (error) {
    console.error('Aprovar transporte error:', error);
    res.status(500).json({ error: 'Erro ao aprovar empresa de transporte' });
  }
});

// POST /api/v1/admin/transportes/:id/rejeitar
router.post('/transportes/:id/rejeitar', async (req: AuthRequest, res: Response) => {
  try {
    const { motivo } = req.body;

    const result = await query(
      `UPDATE empresas_transporte SET aprovada = false, updated_at = NOW() WHERE id = ? RETURNING id, nome`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Empresa de transporte não encontrada' });
      return;
    }

    await query(
      `UPDATE usuarios SET status_conta = 'rejeitada' WHERE entidade_id = ? AND entidade_tipo = 'empresa_transporte'`,
      [req.params.id]
    );

    await query(
      `INSERT INTO logs_auditoria (usuario_id, acao, detalhes, ip_address)
       VALUES (?, 'rejeitar_transporte', ?, ?)`,
      [req.userId, JSON.stringify({ transporte_id: req.params.id, motivo }), req.ip]
    );

    res.json({ message: 'Empresa de transporte rejeitada', transporte: result.rows[0] });
  } catch (error) {
    console.error('Rejeitar transporte error:', error);
    res.status(500).json({ error: 'Erro ao rejeitar empresa de transporte' });
  }
});

// GET /api/v1/admin/atividades
router.get('/atividades', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '20' } = req.query;
    const limitNum = parseInt(limit as string);

    // Use logs_auditoria if available, otherwise aggregate from tables
    const logsResult = await query(
      `SELECT * FROM logs_auditoria ORDER BY created_at DESC LIMIT $1`,
      [limitNum]
    );

    if (logsResult.rows.length > 0) {
      res.json(logsResult.rows);
      return;
    }

    // Fallback: aggregate recent activity
    const atividades: any[] = [];

    const [pedidosRecentes, usuariosRecentes, consultasRecentes] = await Promise.all([
      query(
        `SELECT 'pedido' as tipo, p.id, p.numero_pedido, p.status, p.created_at,
                u.nome_completo as usuario_nome
         FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id
         ORDER BY p.created_at DESC LIMIT $1`,
        [limitNum]
      ),
      query(
        `SELECT 'usuario' as tipo, id, nome_completo, tipo_usuario, created_at
         FROM usuarios ORDER BY created_at DESC LIMIT $1`,
        [limitNum]
      ),
      query(
        `SELECT 'consulta' as tipo, c.id, c.status, c.created_at,
                u.nome_completo as paciente_nome
         FROM consultas c JOIN usuarios u ON c.paciente_id = u.id
         ORDER BY c.created_at DESC LIMIT $1`,
        [limitNum]
      ),
    ]);

    pedidosRecentes.rows.forEach((p: any) => {
      atividades.push({
        tipo: 'pedido', id: p.id,
        texto: `Novo pedido #${p.numero_pedido} recebido`,
        detalhes: `Cliente: ${p.usuario_nome}`,
        status: p.status, created_at: p.created_at,
      });
    });

    usuariosRecentes.rows.forEach((u: any) => {
      atividades.push({
        tipo: 'usuario', id: u.id,
        texto: 'Novo usuário cadastrado',
        detalhes: `${u.nome_completo} - ${u.tipo_usuario}`,
        created_at: u.created_at,
      });
    });

    consultasRecentes.rows.forEach((c: any) => {
      atividades.push({
        tipo: 'consulta', id: c.id,
        texto: 'Nova consulta agendada',
        detalhes: `Paciente: ${c.paciente_nome}`,
        status: c.status, created_at: c.created_at,
      });
    });

    atividades.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(atividades.slice(0, limitNum));
  } catch (error) {
    console.error('Get atividades error:', error);
    res.status(500).json({ error: 'Erro ao buscar atividades' });
  }
});

export default router;
