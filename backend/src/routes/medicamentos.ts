import { Router, Response } from 'express';
import { query } from '../config/database';

const router = Router();

// GET /api/v1/medicamentos
router.get('/', async (req, res: Response) => {
  try {
    const { categoria, search, limit = '50', offset = '0' } = req.query;

    let queryText = 'SELECT * FROM medicamentos WHERE is_ativo = true';
    const params: any[] = [];
    let paramCount = 0;

    if (categoria) {
      paramCount++;
      queryText += ` AND categoria = $${paramCount}`;
      params.push(categoria);
    }

    if (search) {
      paramCount++;
      queryText += ` AND (nome ILIKE $${paramCount}`;
      params.push(`%${search}%`);
      paramCount++;
      queryText += ` OR principio_ativo ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    paramCount++;
    queryText += ` ORDER BY nome LIMIT $${paramCount}`;
    params.push(parseInt(limit as string));
    paramCount++;
    queryText += ` OFFSET $${paramCount}`;
    params.push(parseInt(offset as string));

    const result = await query(queryText, params);

    res.json(result.rows);
  } catch (error) {
    console.error('List medicamentos error:', error);
    res.status(500).json({ error: 'Erro ao listar medicamentos' });
  }
});

// GET /api/v1/medicamentos/:id
router.get('/:id', async (req, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM medicamentos WHERE id = $1 AND is_ativo = true',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Medicamento não encontrado' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get medicamento error:', error);
    res.status(500).json({ error: 'Erro ao buscar medicamento' });
  }
});

export default router;
