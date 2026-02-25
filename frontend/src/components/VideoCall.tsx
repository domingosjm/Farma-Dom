import { useState, useEffect, useRef } from 'react';
import webrtcService from '@/services/webrtcService';

interface VideoCallProps {
  consultaId: string;
  isInitiator: boolean; // true se for quem iniciou a chamada
  onEnd: () => void;
  onError?: (error: string) => void;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'local' | 'remote';
  timestamp: Date;
}

const VideoCall = ({ consultaId, isInitiator, onEnd, onError }: VideoCallProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callStartTimeRef = useRef<Date | null>(null);
  const signalingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeCall();
    
    return () => {
      cleanup();
    };
  }, []);

  // Timer de duração da chamada
  useEffect(() => {
    if (isConnected && callStartTimeRef.current) {
      const interval = setInterval(() => {
        const duration = Math.floor((Date.now() - callStartTimeRef.current!.getTime()) / 1000);
        setCallDuration(duration);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const initializeCall = async () => {
    try {
      // Inicializar peer connection
      await webrtcService.initializePeerConnection();

      // Configurar callbacks
      webrtcService.onLocalStream((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      });

      webrtcService.onRemoteStream((stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });

      webrtcService.onConnectionStateChange((state) => {
        setConnectionState(state);
        if (state === 'connected') {
          setIsConnected(true);
          callStartTimeRef.current = new Date();
        } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          setIsConnected(false);
        }
      });

      webrtcService.onDataChannelMessage((message) => {
        try {
          const data = JSON.parse(message);
          if (data.type === 'chat') {
            addChatMessage(data.text, 'remote');
          }
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
        }
      });

      // Obter mídia local
      await webrtcService.getLocalStream(true, true);

      // Iniciar sinalização
      if (isInitiator) {
        await createOffer();
      }

      // Polling para sinalização (idealmente deveria usar WebSocket)
      startSignalingPolling();

    } catch (error) {
      console.error('Erro ao inicializar chamada:', error);
      onError?.('Erro ao inicializar chamada. Verifique as permissões de câmera e microfone.');
    }
  };

  const createOffer = async () => {
    try {
      const offer = await webrtcService.createOffer();
      
      // Enviar offer para o backend (sinalização)
      await fetch(`/api/v1/consultas/${consultaId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'offer', data: offer }),
        credentials: 'include',
      });

      webrtcService.onIceCandidate((candidate) => {
        // Enviar ICE candidate
        fetch(`/api/v1/consultas/${consultaId}/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'candidate', data: candidate }),
          credentials: 'include',
        });
      });
    } catch (error) {
      console.error('Erro ao criar oferta:', error);
      onError?.('Erro ao estabelecer conexão');
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      await webrtcService.setRemoteDescription(answer);
    } catch (error) {
      console.error('Erro ao processar resposta:', error);
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      const answer = await webrtcService.createAnswer(offer);
      
      // Enviar answer para o backend
      await fetch(`/api/v1/consultas/${consultaId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'answer', data: answer }),
        credentials: 'include',
      });

      webrtcService.onIceCandidate((candidate) => {
        fetch(`/api/v1/consultas/${consultaId}/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'candidate', data: candidate }),
          credentials: 'include',
        });
      });
    } catch (error) {
      console.error('Erro ao processar oferta:', error);
    }
  };

  const startSignalingPolling = () => {
    // Fazer polling para mensagens de sinalização
    signalingInterval.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/consultas/${consultaId}/signal`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const signals = await response.json();
          
          for (const signal of signals) {
            if (signal.type === 'offer' && !isInitiator) {
              await handleOffer(signal.data);
            } else if (signal.type === 'answer' && isInitiator) {
              await handleAnswer(signal.data);
            } else if (signal.type === 'candidate') {
              await webrtcService.addIceCandidate(signal.data);
            }
          }
        }
      } catch (error) {
        console.error('Erro no polling de sinalização:', error);
      }
    }, 1000); // Poll a cada segundo
  };

  const toggleVideo = () => {
    const newState = !isVideoEnabled;
    webrtcService.toggleVideo(newState);
    setIsVideoEnabled(newState);
  };

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    webrtcService.toggleAudio(newState);
    setIsAudioEnabled(newState);
  };

  const toggleScreenShare = async () => {
    try {
      if (!isSharingScreen) {
        await webrtcService.shareScreen();
        setIsSharingScreen(true);
      } else {
        // Voltar para câmera
        await webrtcService.getLocalStream(true, isAudioEnabled);
        setIsSharingScreen(false);
      }
    } catch (error) {
      console.error('Erro ao compartilhar tela:', error);
      onError?.('Erro ao compartilhar tela');
    }
  };

  const addChatMessage = (text: string, sender: 'local' | 'remote') => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, message]);
  };

  const sendChatMessage = () => {
    if (newMessage.trim()) {
      const messageData = {
        type: 'chat',
        text: newMessage,
      };
      
      webrtcService.sendMessage(JSON.stringify(messageData));
      addChatMessage(newMessage, 'local');
      setNewMessage('');
    }
  };

  const endCall = () => {
    cleanup();
    onEnd();
  };

  const cleanup = () => {
    if (signalingInterval.current) {
      clearInterval(signalingInterval.current);
    }
    webrtcService.disconnect();
  };

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4 z-10">
        <div className="flex justify-between items-center text-white">
          <div>
            <h2 className="text-lg font-semibold">Consulta por Vídeo</h2>
            <p className="text-sm text-gray-300">
              {isConnected ? `Duração: ${formatDuration(callDuration)}` : 'Conectando...'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              connectionState === 'connected' ? 'bg-green-500' : 
              connectionState === 'connecting' ? 'bg-yellow-500' : 
              'bg-red-500'
            }`}>
              {connectionState === 'connected' ? 'Conectado' : 
               connectionState === 'connecting' ? 'Conectando' : 
               'Desconectado'}
            </span>
          </div>
        </div>
      </div>

      {/* Vídeo Remoto (Tela Principal) */}
      <div className="w-full h-full relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">Aguardando conexão...</p>
            </div>
          </div>
        )}
      </div>

      {/* Vídeo Local (Picture-in-Picture) */}
      <div className="absolute bottom-24 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-2xl z-20">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!isVideoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <span className="text-4xl">👤</span>
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 z-20">
        <div className="flex justify-center items-center gap-4">
          {/* Toggle Áudio */}
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-colors ${
              isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
            title={isAudioEnabled ? 'Desativar microfone' : 'Ativar microfone'}
          >
            <span className="text-2xl">
              {isAudioEnabled ? '🎤' : '🔇'}
            </span>
          </button>

          {/* Toggle Vídeo */}
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${
              isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
            title={isVideoEnabled ? 'Desativar câmera' : 'Ativar câmera'}
          >
            <span className="text-2xl">
              {isVideoEnabled ? '📹' : '📵'}
            </span>
          </button>

          {/* Compartilhar Tela */}
          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition-colors ${
              isSharingScreen ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Compartilhar tela"
          >
            <span className="text-2xl">🖥️</span>
          </button>

          {/* Chat */}
          <button
            onClick={() => setShowChat(!showChat)}
            className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors relative"
            title="Chat"
          >
            <span className="text-2xl">💬</span>
            {chatMessages.filter(m => m.sender === 'remote').length > 0 && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
            )}
          </button>

          {/* Encerrar Chamada */}
          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
            title="Encerrar chamada"
          >
            <span className="text-2xl">📞</span>
          </button>
        </div>
      </div>

      {/* Painel de Chat */}
      {showChat && (
        <div className="absolute right-4 bottom-28 w-80 h-96 bg-white rounded-lg shadow-2xl z-30 flex flex-col">
          <div className="bg-primary-600 text-white p-3 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">Chat</h3>
            <button onClick={() => setShowChat(false)} className="text-xl">×</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'local' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-2 rounded-lg ${
                    msg.sender === 'local'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <span className="text-xs opacity-70">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Digite uma mensagem..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={sendChatMessage}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
