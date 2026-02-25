import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';

export interface JWTPayload {
  id: string;
  email: string;
  tipo_usuario: string;
  entidade_id?: string;
  entidade_tipo?: string;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
  userId?: string;
  entidadeId?: string;
  entidadeTipo?: string;
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    
    (req as AuthRequest).user = decoded;
    (req as AuthRequest).userId = decoded.id;
    (req as AuthRequest).entidadeId = decoded.entidade_id;
    (req as AuthRequest).entidadeTipo = decoded.entidade_tipo;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;

    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(user.tipo_usuario)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

// Middleware para isolar dados por entidade
export const scopeToEntity = (entityType: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    
    if (!authReq.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Admin tem acesso global
    if (authReq.user.tipo_usuario === 'admin') {
      next();
      return;
    }

    if (authReq.user.entidade_tipo !== entityType || !authReq.user.entidade_id) {
      res.status(403).json({ error: 'Acesso negado a esta entidade' });
      return;
    }

    next();
  };
};

// Middleware para exigir conta aprovada
export const requireApproval = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authReq = req as AuthRequest;
  
  if (!authReq.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Pacientes não precisam de aprovação
  if (authReq.user.tipo_usuario === 'paciente' || authReq.user.tipo_usuario === 'admin') {
    next();
    return;
  }

  try {
    const { query } = await import('../config/database');
    const result = await query(
      'SELECT status_conta FROM usuarios WHERE id = $1',
      [authReq.user.id]
    );

    if (result.rows.length === 0 || result.rows[0].status_conta !== 'ativo') {
      res.status(403).json({ error: 'Conta pendente de aprovação' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar status da conta' });
  }
};
