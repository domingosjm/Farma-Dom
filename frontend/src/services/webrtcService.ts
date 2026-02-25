const METERED_API_KEY = 'a3f6348413cfe0d5ac452c7435a1808c6128';
const METERED_API_URL = 'https://farmadom.metered.live/api/v1/turn/credentials';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  
  private onLocalStreamCallback?: (stream: MediaStream) => void;
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onIceCandidateCallback?: (candidate: RTCIceCandidate) => void;
  private onDataChannelMessageCallback?: (message: string) => void;
  private onConnectionStateChangeCallback?: (state: RTCPeerConnectionState) => void;

  /**
   * Obtém as credenciais TURN/STUN da API Metered
   */
  async getIceServers(): Promise<RTCIceServer[]> {
    try {
      const response = await fetch(`${METERED_API_URL}?apiKey=${METERED_API_KEY}`);
      if (!response.ok) {
        throw new Error('Falha ao obter credenciais TURN');
      }
      const iceServers = await response.json();
      return iceServers;
    } catch (error) {
      console.error('Erro ao buscar ICE servers:', error);
      // Fallback para servidores STUN públicos
      return [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ];
    }
  }

  /**
   * Inicializa a conexão WebRTC
   */
  async initializePeerConnection(): Promise<void> {
    const iceServers = await this.getIceServers();
    
    this.peerConnection = new RTCPeerConnection({
      iceServers: iceServers,
      iceCandidatePoolSize: 10,
    });

    // Configurar listeners
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidateCallback) {
        this.onIceCandidateCallback(event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(event.streams[0]);
        }
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection && this.onConnectionStateChangeCallback) {
        this.onConnectionStateChangeCallback(this.peerConnection.connectionState);
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      this.setupDataChannel(event.channel);
    };
  }

  /**
   * Obtém stream de mídia local (câmera e microfone)
   */
  async getLocalStream(videoEnabled = true, audioEnabled = true): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        video: videoEnabled ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
        audio: audioEnabled ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false,
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (this.onLocalStreamCallback) {
        this.onLocalStreamCallback(this.localStream);
      }

      // Adicionar tracks à peer connection
      if (this.peerConnection) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      return this.localStream;
    } catch (error) {
      console.error('Erro ao acessar mídia local:', error);
      throw new Error('Não foi possível acessar câmera/microfone');
    }
  }

  /**
   * Cria uma oferta WebRTC
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection não inicializada');
    }

    // Criar data channel para mensagens de texto
    this.dataChannel = this.peerConnection.createDataChannel('chat');
    this.setupDataChannel(this.dataChannel);

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  /**
   * Cria uma resposta WebRTC
   */
  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection não inicializada');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    
    return answer;
  }

  /**
   * Define a descrição remota
   */
  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection não inicializada');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
  }

  /**
   * Adiciona candidato ICE remoto
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection não inicializada');
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Erro ao adicionar ICE candidate:', error);
    }
  }

  /**
   * Configura data channel para chat
   */
  private setupDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel;

    this.dataChannel.onopen = () => {
      console.log('Data channel aberto');
    };

    this.dataChannel.onclose = () => {
      console.log('Data channel fechado');
    };

    this.dataChannel.onmessage = (event) => {
      if (this.onDataChannelMessageCallback) {
        this.onDataChannelMessageCallback(event.data);
      }
    };
  }

  /**
   * Envia mensagem pelo data channel
   */
  sendMessage(message: string): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(message);
    } else {
      console.warn('Data channel não está aberto');
    }
  }

  /**
   * Alterna estado do vídeo
   */
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Alterna estado do áudio
   */
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Compartilhar tela
   */
  async shareScreen(): Promise<MediaStream> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as any,
        audio: false,
      });

      if (this.peerConnection && this.localStream) {
        // Substituir track de vídeo
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        // Quando parar de compartilhar, voltar para câmera
        videoTrack.onended = async () => {
          if (this.localStream && sender) {
            const cameraTrack = this.localStream.getVideoTracks()[0];
            await sender.replaceTrack(cameraTrack);
          }
        };
      }

      return screenStream;
    } catch (error) {
      console.error('Erro ao compartilhar tela:', error);
      throw new Error('Não foi possível compartilhar a tela');
    }
  }

  /**
   * Finaliza a conexão e limpa recursos
   */
  disconnect(): void {
    // Parar tracks locais
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Parar tracks remotos
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    // Fechar data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // Fechar peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  // Callbacks
  onLocalStream(callback: (stream: MediaStream) => void): void {
    this.onLocalStreamCallback = callback;
  }

  onRemoteStream(callback: (stream: MediaStream) => void): void {
    this.onRemoteStreamCallback = callback;
  }

  onIceCandidate(callback: (candidate: RTCIceCandidate) => void): void {
    this.onIceCandidateCallback = callback;
  }

  onDataChannelMessage(callback: (message: string) => void): void {
    this.onDataChannelMessageCallback = callback;
  }

  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void): void {
    this.onConnectionStateChangeCallback = callback;
  }

  // Getters
  getCurrentLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState || null;
  }
}

export default new WebRTCService();
