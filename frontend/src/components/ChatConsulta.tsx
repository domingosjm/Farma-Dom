import { useEffect, useState, useRef } from 'react'
import { Send, Paperclip, Phone, Video, X, Loader2, Check, CheckCheck } from 'lucide-react'
import { chatService, Mensagem } from '@/services/chatService'
import { useAuthStore } from '@/stores/authStore'

interface ChatConsultaProps {
  consultaId: string
  nomePaciente?: string
  nomeMedico?: string
  onClose?: () => void
}

export default function ChatConsulta({ consultaId, nomePaciente, nomeMedico, onClose }: ChatConsultaProps) {
  const { user, token } = useAuthStore()
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [novaMensagem, setNovaMensagem] = useState('')
  const [digitando, setDigitando] = useState(false)
  const [usuarioDigitandoNome, setUsuarioDigitandoNome] = useState<string | null>(null)
  const [conectado, setConectado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!token) return

    // Conectar ao Socket.IO
    chatService.connect(token)
    setConectado(true)

    // Entrar na sala da consulta
    chatService.joinConsulta(consultaId)

    // Listeners
    chatService.onHistoricoMensagens((msgs) => {
      setMensagens(msgs)
      scrollToBottom()
    })

    chatService.onNovaMensagem((msg) => {
      setMensagens((prev) => [...prev, msg])
      scrollToBottom()
      
      // Marcar como lida se não for minha mensagem
      if (msg.remetente_id !== user?.id) {
        setTimeout(() => {
          chatService.marcarLidas(consultaId)
        }, 1000)
      }
    })

    chatService.onUsuarioEntrou((usuario) => {
      console.log('Usuário entrou:', usuario.email)
    })

    chatService.onUsuarioSaiu((usuario) => {
      console.log('Usuário saiu:', usuario.email)
    })

    chatService.onUsuarioDigitando((data) => {
      if (data.isTyping) {
        setUsuarioDigitandoNome(data.email)
      } else {
        setUsuarioDigitandoNome(null)
      }
    })

    return () => {
      chatService.leaveConsulta(consultaId)
      chatService.offAllListeners()
    }
  }, [consultaId, token, user?.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!novaMensagem.trim() || enviando) return

    try {
      setEnviando(true)
      chatService.sendMessage(consultaId, novaMensagem.trim())
      setNovaMensagem('')
      
      // Parar de digitar
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      chatService.sendTyping(consultaId, false)
      setDigitando(false)
      
      inputRef.current?.focus()
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    } finally {
      setEnviando(false)
    }
  }

  const handleTyping = (value: string) => {
    setNovaMensagem(value)

    // Notificar que está digitando
    if (!digitando) {
      setDigitando(true)
      chatService.sendTyping(consultaId, true)
    }

    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Parar de digitar após 2 segundos de inatividade
    typingTimeoutRef.current = setTimeout(() => {
      setDigitando(false)
      chatService.sendTyping(consultaId, false)
    }, 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem'
    } else {
      return date.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }
  }

  const groupMessagesByDate = () => {
    const groups: { [key: string]: Mensagem[] } = {}
    
    mensagens.forEach(msg => {
      const date = formatDate(msg.created_at)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(msg)
    })

    return groups
  }

  const messageGroups = groupMessagesByDate()

  const getOutraPessoa = () => {
    if (user?.tipo_usuario === 'paciente') {
      return nomeMedico || 'Médico'
    }
    return nomePaciente || 'Paciente'
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold">{getOutraPessoa()[0]}</span>
          </div>
          <div>
            <h3 className="font-bold">{getOutraPessoa()}</h3>
            <div className="flex items-center space-x-2 text-xs">
              {conectado ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  <span>Offline</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <Video className="w-5 h-5" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {Object.entries(messageGroups).map(([date, msgs]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-gray-300 text-gray-700 text-xs px-3 py-1 rounded-full">
                {date}
              </div>
            </div>

            {/* Messages for this date */}
            {msgs.map((msg) => {
              const isMine = msg.remetente_id === user?.id
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}
                >
                  <div className={`flex items-end space-x-2 max-w-[70%] ${isMine ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {!isMine && (
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {msg.nome_completo[0]}
                        </span>
                      </div>
                    )}
                    
                    <div>
                      {!isMine && (
                        <p className="text-xs text-gray-600 mb-1 ml-2">{msg.nome_completo}</p>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isMine
                            ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-br-none'
                            : 'bg-white text-gray-900 shadow-md rounded-bl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.mensagem}</p>
                        <div className={`flex items-center justify-end space-x-1 mt-1 ${isMine ? 'text-white/70' : 'text-gray-500'}`}>
                          <span className="text-xs">{formatTime(msg.created_at)}</span>
                          {isMine && (
                            msg.lida ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {usuarioDigitandoNome && (
          <div className="flex items-center space-x-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">{usuarioDigitandoNome} está digitando...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>
          
          <input
            ref={inputRef}
            type="text"
            value={novaMensagem}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={enviando}
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!novaMensagem.trim() || enviando}
            className="p-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
