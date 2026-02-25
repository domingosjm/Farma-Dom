import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import { query } from '../config/database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
  tipo_usuario?: string;
  entidade_id?: string | null;
  entidade_tipo?: string | null;
}

interface JoinConsultaData {
  consultaId: string;
}

interface SendMessageData {
  consultaId: string;
  mensagem: string;
  tipo?: 'texto' | 'arquivo' | 'sistema';
  arquivo_url?: string;
  arquivo_nome?: string;
}

interface TypingData {
  consultaId: string;
  isTyping: boolean;
}

export let io: SocketIOServer;

export const setupSocketIO = (httpServer: HTTPServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.CORS_ORIGINS.split(','),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Middleware de autenticação
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as {
        id: string;
        email: string;
        tipo_usuario: string;
        entidade_id?: string;
        entidade_tipo?: string;
      };

      socket.userId = decoded.id;
      socket.email = decoded.email;
      socket.tipo_usuario = decoded.tipo_usuario;
      socket.entidade_id = decoded.entidade_id || null;
      socket.entidade_tipo = decoded.entidade_tipo || null;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`✅ Usuário conectado: ${socket.userId} (${socket.email})`);

    // Registrar usuário online
    try {
      await query(
        `INSERT INTO usuarios_online (usuario_id, socket_id, ultima_atividade)
         VALUES ($1, $2, NOW())
         ON CONFLICT (usuario_id) DO UPDATE SET socket_id = $2, ultima_atividade = NOW()`,
        [socket.userId, socket.id]
      );
    } catch (error) {
      console.error('Erro ao registrar usuário online:', error);
    }

    // Join entity room for real-time notifications scoped to entity
    if (socket.entidade_id && socket.entidade_tipo) {
      socket.join(`entidade_${socket.entidade_tipo}_${socket.entidade_id}`);
    }

    // Entrar em uma sala de consulta
    socket.on('join_consulta', async (data: JoinConsultaData) => {
      try {
        const { consultaId } = data;

        const consultas = await query(
          `SELECT * FROM consultas 
           WHERE id = $1 AND (paciente_id = $2 OR medico_id = $2)`,
          [consultaId, socket.userId]
        );

        if (consultas.rows.length === 0) {
          socket.emit('error', { message: 'Consulta não encontrada ou sem permissão' });
          return;
        }

        socket.join(`consulta_${consultaId}`);

        await query(
          'UPDATE usuarios_online SET consulta_id = $1 WHERE usuario_id = $2',
          [consultaId, socket.userId]
        );

        await query(
          `UPDATE consultas 
           SET chat_ativo = TRUE, chat_iniciado_em = COALESCE(chat_iniciado_em, NOW())
           WHERE id = $1`,
          [consultaId]
        );

        // Buscar histórico de mensagens
        const mensagens = await query(
          `SELECT m.*, u.nome_completo, u.foto_perfil, u.tipo_usuario
           FROM mensagens_chat m
           JOIN usuarios u ON m.remetente_id = u.id
           WHERE m.consulta_id = $1
           ORDER BY m.created_at ASC`,
          [consultaId]
        );

        socket.emit('historico_mensagens', mensagens.rows);

        socket.to(`consulta_${consultaId}`).emit('usuario_entrou', {
          userId: socket.userId,
          email: socket.email,
          tipo_usuario: socket.tipo_usuario,
        });

        console.log(`✅ Usuário ${socket.userId} entrou na consulta ${consultaId}`);
      } catch (error) {
        console.error('Erro ao entrar na consulta:', error);
        socket.emit('error', { message: 'Erro ao entrar na consulta' });
      }
    });

    // Enviar mensagem
    socket.on('send_message', async (data: SendMessageData) => {
      try {
        const { consultaId, mensagem, tipo = 'texto', arquivo_url, arquivo_nome } = data;

        const consultas = await query(
          `SELECT * FROM consultas 
           WHERE id = $1 AND (paciente_id = $2 OR medico_id = $2)`,
          [consultaId, socket.userId]
        );

        if (consultas.rows.length === 0) {
          socket.emit('error', { message: 'Sem permissão para enviar mensagem' });
          return;
        }

        const mensagemId = crypto.randomUUID();
        await query(
          `INSERT INTO mensagens_chat 
           (id, consulta_id, remetente_id, mensagem, tipo, arquivo_url, arquivo_nome)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [mensagemId, consultaId, socket.userId, mensagem, tipo, arquivo_url || null, arquivo_nome || null]
        );

        const mensagemCompleta = await query(
          `SELECT m.*, u.nome_completo, u.foto_perfil, u.tipo_usuario
           FROM mensagens_chat m
           JOIN usuarios u ON m.remetente_id = u.id
           WHERE m.id = $1`,
          [mensagemId]
        );

        io.to(`consulta_${consultaId}`).emit('nova_mensagem', mensagemCompleta.rows[0]);

        console.log(`📨 Mensagem enviada na consulta ${consultaId}`);
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        socket.emit('error', { message: 'Erro ao enviar mensagem' });
      }
    });

    // Indicador de digitação
    socket.on('typing', (data: TypingData) => {
      const { consultaId, isTyping } = data;
      socket.to(`consulta_${consultaId}`).emit('usuario_digitando', {
        userId: socket.userId,
        email: socket.email,
        isTyping,
      });
    });

    // Marcar mensagens como lidas
    socket.on('marcar_lidas', async (data: { consultaId: string }) => {
      try {
        await query(
          `UPDATE mensagens_chat 
           SET lida = TRUE 
           WHERE consulta_id = $1 AND remetente_id != $2 AND lida = FALSE`,
          [data.consultaId, socket.userId]
        );

        socket.to(`consulta_${data.consultaId}`).emit('mensagens_lidas', {
          userId: socket.userId,
        });
      } catch (error) {
        console.error('Erro ao marcar mensagens como lidas:', error);
      }
    });

    // Sair da consulta
    socket.on('leave_consulta', async (data: JoinConsultaData) => {
      const { consultaId } = data;
      socket.leave(`consulta_${consultaId}`);

      try {
        await query(
          'UPDATE usuarios_online SET consulta_id = NULL WHERE usuario_id = $1',
          [socket.userId]
        );
      } catch (error) {
        console.error('Erro ao atualizar saída:', error);
      }

      socket.to(`consulta_${consultaId}`).emit('usuario_saiu', {
        userId: socket.userId,
        email: socket.email,
      });

      console.log(`👋 Usuário ${socket.userId} saiu da consulta ${consultaId}`);
    });

    // Desconexão
    socket.on('disconnect', async () => {
      console.log(`❌ Usuário desconectado: ${socket.userId}`);

      try {
        await query(
          'DELETE FROM usuarios_online WHERE usuario_id = $1',
          [socket.userId]
        );
      } catch (error) {
        console.error('Erro ao remover usuário online:', error);
      }
    });
  });

  console.log('✅ Socket.IO configurado com sucesso');
  return io;
};

// Helper to emit notifications to a specific entity
export const notifyEntity = (entityType: string, entityId: string, event: string, data: any) => {
  if (io) {
    io.to(`entidade_${entityType}_${entityId}`).emit(event, data);
  }
};

// Helper to emit to a specific user
export const notifyUser = async (userId: string, event: string, data: any) => {
  if (!io) return;
  const result = await query(
    'SELECT socket_id FROM usuarios_online WHERE usuario_id = $1',
    [userId]
  );
  if (result.rows.length > 0) {
    io.to(result.rows[0].socket_id).emit(event, data);
  }
};
