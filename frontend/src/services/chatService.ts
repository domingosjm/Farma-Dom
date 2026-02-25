import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:8000';

export interface Mensagem {
  id: string;
  consulta_id: string;
  remetente_id: string;
  mensagem: string;
  tipo: 'texto' | 'arquivo' | 'sistema';
  arquivo_url?: string;
  arquivo_nome?: string;
  lida: boolean;
  created_at: string;
  nome_completo: string;
  foto_perfil?: string;
  tipo_usuario: string;
}

export interface UsuarioOnline {
  userId: string;
  email: string;
  tipo_usuario?: string;
}

class ChatService {
  private socket: Socket | null = null;
  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }
    this.socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ Conectado ao servidor Socket.IO');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Desconectado do servidor Socket.IO');
    });

    this.socket.on('error', (error: { message: string }) => {
      console.error('Erro Socket.IO:', error.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConsulta(consultaId: string) {
    if (!this.socket) {
      throw new Error('Socket não conectado');
    }
    this.socket.emit('join_consulta', { consultaId });
  }

  leaveConsulta(consultaId: string) {
    if (!this.socket) {
      throw new Error('Socket não conectado');
    }
    this.socket.emit('leave_consulta', { consultaId });
  }

  sendMessage(consultaId: string, mensagem: string, tipo: 'texto' | 'arquivo' = 'texto', arquivo_url?: string, arquivo_nome?: string) {
    if (!this.socket) {
      throw new Error('Socket não conectado');
    }
    this.socket.emit('send_message', {
      consultaId,
      mensagem,
      tipo,
      arquivo_url,
      arquivo_nome
    });
  }

  sendTyping(consultaId: string, isTyping: boolean) {
    if (!this.socket) {
      throw new Error('Socket não conectado');
    }
    this.socket.emit('typing', { consultaId, isTyping });
  }

  marcarLidas(consultaId: string) {
    if (!this.socket) {
      throw new Error('Socket não conectado');
    }
    this.socket.emit('marcar_lidas', { consultaId });
  }

  onHistoricoMensagens(callback: (mensagens: Mensagem[]) => void) {
    if (!this.socket) return;
    this.socket.on('historico_mensagens', callback);
  }

  onNovaMensagem(callback: (mensagem: Mensagem) => void) {
    if (!this.socket) return;
    this.socket.on('nova_mensagem', callback);
  }

  onUsuarioEntrou(callback: (usuario: UsuarioOnline) => void) {
    if (!this.socket) return;
    this.socket.on('usuario_entrou', callback);
  }

  onUsuarioSaiu(callback: (usuario: UsuarioOnline) => void) {
    if (!this.socket) return;
    this.socket.on('usuario_saiu', callback);
  }

  onUsuarioDigitando(callback: (data: UsuarioOnline & { isTyping: boolean }) => void) {
    if (!this.socket) return;
    this.socket.on('usuario_digitando', callback);
  }

  onMensagensLidas(callback: (data: { userId: string }) => void) {
    if (!this.socket) return;
    this.socket.on('mensagens_lidas', callback);
  }

  offAllListeners() {
    if (!this.socket) return;
    this.socket.off('historico_mensagens');
    this.socket.off('nova_mensagem');
    this.socket.off('usuario_entrou');
    this.socket.off('usuario_saiu');
    this.socket.off('usuario_digitando');
    this.socket.off('mensagens_lidas');
  }
}

export const chatService = new ChatService();
