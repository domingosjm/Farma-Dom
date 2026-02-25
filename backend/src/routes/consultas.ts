import { Router, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// GET /api/v1/consultas - Listar consultas do usuário
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT c.*, 
        u.nome_completo as nome_paciente,
        m.nome_completo as nome_medico
       FROM consultas c
       LEFT JOIN usuarios u ON c.paciente_id = u.id
       LEFT JOIN usuarios m ON c.medico_id = m.id
       WHERE c.paciente_id = $1 
       ORDER BY c.data_hora_agendada DESC`,
      [req.user?.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('List consultas error:', error);
    res.status(500).json({ error: 'Erro ao listar consultas' });
  }
});

// GET /api/v1/consultas/horarios-disponiveis
router.get('/horarios-disponiveis', async (req: AuthRequest, res: Response) => {
  try {
    const { data, especialidade } = req.query;

    if (!data) {
      res.status(400).json({ error: 'Data é obrigatória' });
      return;
    }

    let queryText = `SELECT data_hora_agendada FROM consultas 
                     WHERE DATE(data_hora_agendada) = $1 
                     AND status NOT IN ('cancelada', 'concluida')`;
    const params: any[] = [data];

    if (especialidade) {
      queryText += ' AND especialidade = $2';
      params.push(especialidade);
    }

    const result = await query(queryText, params);

    const horariosDisponiveis: string[] = [];
    const horariosOcupados = new Set(
      result.rows.map((c: any) => {
        const date = new Date(c.data_hora_agendada);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      })
    );

    for (let hora = 8; hora < 18; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        const horario = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
        if (!horariosOcupados.has(horario)) {
          horariosDisponiveis.push(horario);
        }
      }
    }

    res.json(horariosDisponiveis);
  } catch (error) {
    console.error('Get horarios error:', error);
    res.status(500).json({ error: 'Erro ao buscar horários' });
  }
});

// GET /api/v1/consultas/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT c.*, 
        u.nome_completo as nome_paciente,
        m.nome_completo as nome_medico
       FROM consultas c
       LEFT JOIN usuarios u ON c.paciente_id = u.id
       LEFT JOIN usuarios m ON c.medico_id = m.id
       WHERE c.id = $1 AND (c.paciente_id = $2 OR c.medico_id = $2)`,
      [req.params.id, req.user?.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Consulta não encontrada' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get consulta error:', error);
    res.status(500).json({ error: 'Erro ao buscar consulta' });
  }
});

// POST /api/v1/consultas
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { tipo_consulta, especialidade, data_hora_agendada, sintomas, valor, hospital_id } = req.body;

    if (!tipo_consulta || !especialidade || !data_hora_agendada || !valor) {
      res.status(400).json({ error: 'Campos obrigatórios: tipo_consulta, especialidade, data_hora_agendada, valor' });
      return;
    }

    const existente = await query(
      `SELECT id FROM consultas 
       WHERE data_hora_agendada = $1 AND especialidade = $2
       AND status NOT IN ('cancelada', 'concluida')`,
      [data_hora_agendada, especialidade]
    );

    if (existente.rows.length > 0) {
      res.status(400).json({ error: 'Horário não disponível para esta especialidade' });
      return;
    }

    const consultaId = crypto.randomUUID();

    await query(
      `INSERT INTO consultas (id, paciente_id, tipo_consulta, especialidade, data_hora_agendada, sintomas, valor, status, hospital_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'agendada', $8)`,
      [consultaId, req.user?.id, tipo_consulta, especialidade, data_hora_agendada, sintomas || null, valor, hospital_id || null]
    );

    const result = await query(
      `SELECT c.*, u.nome_completo as nome_paciente
       FROM consultas c
       LEFT JOIN usuarios u ON c.paciente_id = u.id
       WHERE c.id = $1`,
      [consultaId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create consulta error:', error);
    res.status(500).json({ error: 'Erro ao criar consulta' });
  }
});

// PUT /api/v1/consultas/:id/cancelar
router.put('/:id/cancelar', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `UPDATE consultas SET status = 'cancelada', updated_at = NOW()
       WHERE id = $1 AND paciente_id = $2 AND status IN ('agendada', 'confirmada')
       RETURNING id`,
      [req.params.id, req.user?.id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Consulta não encontrada ou não pode ser cancelada' });
      return;
    }

    res.json({ message: 'Consulta cancelada com sucesso' });
  } catch (error) {
    console.error('Cancel consulta error:', error);
    res.status(500).json({ error: 'Erro ao cancelar consulta' });
  }
});

// POST /api/v1/consultas/:id/signal
router.post('/:id/signal', async (req: AuthRequest, res: Response) => {
  try {
    const { type, data } = req.body;
    const consultaId = req.params.id;

    if (!type || !data) {
      res.status(400).json({ error: 'Type e data são obrigatórios' });
      return;
    }

    const consultas = await query(
      `SELECT * FROM consultas WHERE id = $1 AND (paciente_id = $2 OR medico_id = $2)`,
      [consultaId, req.user?.id]
    );

    if (consultas.rows.length === 0) {
      res.status(404).json({ error: 'Consulta não encontrada' });
      return;
    }

    const signalId = crypto.randomUUID();
    await query(
      `INSERT INTO consultas_signals (id, consulta_id, user_id, signal_type, signal_data)
       VALUES ($1, $2, $3, $4, $5)`,
      [signalId, consultaId, req.user?.id, type, JSON.stringify(data)]
    );

    res.json({ message: 'Sinal enviado com sucesso', id: signalId });
  } catch (error) {
    console.error('Send signal error:', error);
    res.status(500).json({ error: 'Erro ao enviar sinal' });
  }
});

// GET /api/v1/consultas/:id/signal
router.get('/:id/signal', async (req: AuthRequest, res: Response) => {
  try {
    const consultaId = req.params.id;

    const consultas = await query(
      `SELECT * FROM consultas WHERE id = $1 AND (paciente_id = $2 OR medico_id = $2)`,
      [consultaId, req.user?.id]
    );

    if (consultas.rows.length === 0) {
      res.status(404).json({ error: 'Consulta não encontrada' });
      return;
    }

    const signals = await query(
      `SELECT id, signal_type as type, signal_data as data, created_at
       FROM consultas_signals
       WHERE consulta_id = $1 AND user_id != $2
       ORDER BY created_at ASC`,
      [consultaId, req.user?.id]
    );

    const parsedSignals = signals.rows.map((signal: any) => ({
      id: signal.id,
      type: signal.type,
      data: JSON.parse(signal.data),
      created_at: signal.created_at,
    }));

    if (parsedSignals.length > 0) {
      const signalIds = parsedSignals.map((s: any) => s.id);
      const placeholders = signalIds.map((_: any, i: number) => `$${i + 1}`).join(',');
      await query(`DELETE FROM consultas_signals WHERE id IN (${placeholders})`, signalIds);
    }

    res.json(parsedSignals);
  } catch (error) {
    console.error('Get signals error:', error);
    res.status(500).json({ error: 'Erro ao buscar sinais' });
  }
});

// PUT /api/v1/consultas/:id/iniciar
router.put('/:id/iniciar', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `UPDATE consultas SET status = 'em_andamento', data_hora_realizada = NOW(), updated_at = NOW()
       WHERE id = $1 AND (paciente_id = $2 OR medico_id = $2)
       AND status IN ('agendada', 'confirmada')
       RETURNING id`,
      [req.params.id, req.user?.id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Consulta não encontrada ou não pode ser iniciada' });
      return;
    }

    res.json({ message: 'Consulta iniciada com sucesso' });
  } catch (error) {
    console.error('Start consulta error:', error);
    res.status(500).json({ error: 'Erro ao iniciar consulta' });
  }
});

// PUT /api/v1/consultas/:id/finalizar
router.put('/:id/finalizar', async (req: AuthRequest, res: Response) => {
  try {
    const { diagnostico, prescricao, observacoes, duracao_minutos } = req.body;

    const result = await query(
      `UPDATE consultas 
       SET status = 'concluida', diagnostico = $1, prescricao = $2,
           observacoes = $3, duracao_minutos = $4, updated_at = NOW()
       WHERE id = $5 AND (paciente_id = $6 OR medico_id = $6)
       AND status = 'em_andamento'
       RETURNING id`,
      [diagnostico || null, prescricao || null, observacoes || null, duracao_minutos || null, req.params.id, req.user?.id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Consulta não encontrada ou não pode ser finalizada' });
      return;
    }

    res.json({ message: 'Consulta finalizada com sucesso' });
  } catch (error) {
    console.error('End consulta error:', error);
    res.status(500).json({ error: 'Erro ao finalizar consulta' });
  }
});

export default router;
