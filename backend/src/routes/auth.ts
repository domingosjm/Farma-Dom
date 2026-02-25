import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../config/database';
import config from '../config/env';
import { authenticateToken, AuthRequest, JWTPayload } from '../middleware/auth';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  nome_completo: z.string().min(3),
  email: z.string().email(),
  telefone: z.string().min(9).optional(),
  senha: z.string().min(6),
  tipo_usuario: z.enum([
    'paciente', 'medico', 'farmacia_admin', 'farmacia_funcionario',
    'hospital_gerente', 'transporte_gerente', 'motorista', 'admin'
  ]).default('paciente'),
  nif: z.string().optional(),
  data_nascimento: z.string().optional(),
  genero: z.string().optional(),
  // Dados de entidade (para farmácia, hospital, transporte)
  entidade_nome: z.string().optional(),
  entidade_endereco: z.string().optional(),
  entidade_cidade: z.string().optional(),
  entidade_provincia: z.string().optional(),
  entidade_telefone: z.string().optional(),
  entidade_email: z.string().optional(),
  entidade_licenca: z.string().optional(),
  entidade_zona: z.string().optional(),
  // Dados de médico
  especialidade: z.string().optional(),
  numero_ordem: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

// Helper function to generate tokens
const generateTokens = (payload: JWTPayload) => {
  const accessToken = jwt.sign(
    payload,
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { id: payload.id, email: payload.email },
    config.JWT_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
};

// POST /api/v1/auth/registrar
router.post('/registrar', async (req: Request, res: Response) => {
  try {
    const userData = registerSchema.parse(req.body);

    // Check if email exists
    const existing = await query(
      'SELECT id FROM usuarios WHERE email = $1',
      [userData.email]
    );

    if (existing.rows.length > 0) {
      res.status(400).json({ error: 'Email já cadastrado' });
      return;
    }

    // Hash password
    const senhaHash = await bcrypt.hash(userData.senha, 10);
    const userId = crypto.randomUUID();

    let entidadeId: string | undefined;
    let entidadeTipo: string | undefined;

    // Determinar status da conta baseado no tipo
    const needsApproval = ['medico', 'farmacia_admin', 'hospital_gerente', 'transporte_gerente'].includes(userData.tipo_usuario);
    const statusConta = needsApproval ? 'pendente_aprovacao' : 'ativo';

    // Criar entidade associada se necessário
    if (userData.tipo_usuario === 'farmacia_admin' && userData.entidade_nome) {
      entidadeTipo = 'farmacia';
      const farmResult = await query(
        `INSERT INTO farmacias (nome, endereco, cidade, provincia, zona, telefone, email, licenca)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          userData.entidade_nome, userData.entidade_endereco || null,
          userData.entidade_cidade || null, userData.entidade_provincia || null,
          userData.entidade_zona || null, userData.entidade_telefone || null,
          userData.entidade_email || null, userData.entidade_licenca || null,
        ]
      );
      entidadeId = farmResult.rows[0].id;
    } else if (userData.tipo_usuario === 'hospital_gerente' && userData.entidade_nome) {
      entidadeTipo = 'hospital';
      const hospResult = await query(
        `INSERT INTO hospitais (nome, endereco, cidade, provincia, telefone, email, licenca)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          userData.entidade_nome, userData.entidade_endereco || null,
          userData.entidade_cidade || null, userData.entidade_provincia || null,
          userData.entidade_telefone || null, userData.entidade_email || null,
          userData.entidade_licenca || null,
        ]
      );
      entidadeId = hospResult.rows[0].id;
    } else if (userData.tipo_usuario === 'transporte_gerente' && userData.entidade_nome) {
      entidadeTipo = 'empresa_transporte';
      const transpResult = await query(
        `INSERT INTO empresas_transporte (nome, telefone, email)
         VALUES ($1, $2, $3) RETURNING id`,
        [userData.entidade_nome, userData.entidade_telefone || null, userData.entidade_email || null]
      );
      entidadeId = transpResult.rows[0].id;
    }

    // Create user
    await query(
      `INSERT INTO usuarios (id, nome_completo, email, telefone, senha_hash, tipo_usuario, status_conta, nif, data_nascimento, genero, entidade_id, entidade_tipo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        userId, userData.nome_completo, userData.email,
        userData.telefone || null, senhaHash, userData.tipo_usuario,
        statusConta, userData.nif || null,
        userData.data_nascimento || null, userData.genero || null,
        entidadeId || null, entidadeTipo || null,
      ]
    );

    // Se for médico, criar perfil profissional
    if (userData.tipo_usuario === 'medico') {
      await query(
        `INSERT INTO profissionais_saude (usuario_id, especialidade, numero_ordem)
         VALUES ($1, $2, $3)`,
        [userId, userData.especialidade || null, userData.numero_ordem || null]
      );
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: userId,
      email: userData.email,
      tipo_usuario: userData.tipo_usuario,
      entidade_id: entidadeId,
      entidade_tipo: entidadeTipo,
    });

    res.status(201).json({
      user: {
        id: userId,
        nome_completo: userData.nome_completo,
        email: userData.email,
        tipo_usuario: userData.tipo_usuario,
        status_conta: statusConta,
        entidade_id: entidadeId,
        entidade_tipo: entidadeTipo,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, senha } = loginSchema.parse(req.body);

    // Get user
    const result = await query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(senha, user.senha_hash);
    if (!validPassword) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    // Check if active
    if (!user.is_ativo) {
      res.status(403).json({ error: 'Usuário inativo' });
      return;
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      tipo_usuario: user.tipo_usuario,
      entidade_id: user.entidade_id,
      entidade_tipo: user.entidade_tipo,
    });

    // Remove password from response
    const { senha_hash, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT id, nome_completo, email, telefone, tipo_usuario, status_conta,
              nif, data_nascimento, genero, foto_perfil, endereco_completo,
              cidade, provincia, is_ativo, entidade_id, entidade_tipo, created_at
       FROM usuarios WHERE id = $1`,
      [req.userId]
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

// PUT /api/v1/auth/me
router.put('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const allowedFields = ['nome_completo', 'telefone', 'nif', 'data_nascimento', 'genero', 'foto_perfil', 'endereco_completo', 'cidade', 'provincia'];
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        paramCount++;
        updates.push(`${field} = $${paramCount}`);
        values.push(req.body[field]);
      }
    });

    if (updates.length === 0) {
      res.status(400).json({ error: 'Nenhum campo para atualizar' });
      return;
    }

    paramCount++;
    updates.push(`updated_at = NOW()`);
    values.push(req.userId);

    await query(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    // Get updated user
    const result = await query(
      'SELECT id, nome_completo, email, telefone, tipo_usuario, foto_perfil, entidade_id, entidade_tipo FROM usuarios WHERE id = $1',
      [req.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

export default router;
