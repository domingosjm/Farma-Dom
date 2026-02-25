import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, Users, Clock, MessageSquare,
  Activity, TrendingUp, DollarSign, Star, Phone, Video, FileText,
  UserCheck, Stethoscope, Package, X
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import medicoService, { MedicoStats, ConsultaDia } from '@/services/medicoService'
import { toast } from 'react-hot-toast'
import ChatConsulta from '@/components/ChatConsulta'
import VideoCall from '@/components/VideoCall'

export default function DashboardMedico() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<MedicoStats>({
    consultas_hoje: 0,
    consultas_semana: 0,
    pacientes_total: 0,
    proxima_consulta: null,
    avaliacoes_media: 0,
    total_avaliacoes: 0,
    receita_mes: 0
  })
  const [consultasHoje, setConsultasHoje] = useState<ConsultaDia[]>([])
  const [loading, setLoading] = useState(true)
  const [iniciandoConsulta, setIniciandoConsulta] = useState<string | null>(null)
  const [consultaAberta, setConsultaAberta] = useState<ConsultaDia | null>(null)
  const [modoVisualizacao, setModoVisualizacao] = useState<'chat' | 'video' | 'opcoes'>('opcoes')

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      const [statsData, consultasData] = await Promise.all([
        medicoService.getStats(),
        medicoService.getConsultasHoje()
      ])

      setStats(statsData)
      setConsultasHoje(consultasData)
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast.error(error.response?.data?.message || 'Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleIniciarConsulta = async (consultaId: string) => {
    try {
      setIniciandoConsulta(consultaId)
      await medicoService.iniciarConsulta(consultaId)
      
      // Buscar os dados da consulta
      const consulta = consultasHoje.find(c => c.id === consultaId)
      if (consulta) {
        setConsultaAberta(consulta)
        setModoVisualizacao('opcoes')
        toast.success('Consulta iniciada com sucesso!')
      }
    } catch (error: any) {
      console.error('Erro ao iniciar consulta:', error)
      toast.error(error.response?.data?.message || 'Erro ao iniciar consulta')
    } finally {
      setIniciandoConsulta(null)
    }
  }

  const handleFecharConsulta = () => {
    setConsultaAberta(null)
    setModoVisualizacao('opcoes')
    carregarDados() // Recarregar dados após fechar
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      confirmada: 'bg-blue-100 text-blue-800',
      agendada: 'bg-yellow-100 text-yellow-800',
      em_andamento: 'bg-purple-100 text-purple-800',
      concluida: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getTipoIcon = (tipo: string) => {
    const icons: any = {
      video: <Video className="w-4 h-4" />,
      presencial: <Stethoscope className="w-4 h-4" />,
      chat: <MessageSquare className="w-4 h-4" />,
      audio: <Phone className="w-4 h-4" />
    }
    return icons[tipo] || <Calendar className="w-4 h-4" />
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Activity className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50/30">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                <span className="text-primary-700">Dashboard</span>{' '}
                <span className="text-accent-600">Médico</span>
              </h1>
              <p className="text-gray-600 mt-1">Bem-vindo, Dr(a). {user?.nome_completo}</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm text-gray-600">Hoje</p>
                <p className="font-bold text-gray-900">
                  {new Date().toLocaleDateString('pt-AO', { 
                    day: '2-digit', 
                    month: 'long' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Consultas Hoje */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="stat-icon bg-primary-100">
                <Calendar className="w-6 h-6 text-primary-600" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{stats.consultas_hoje}</p>
                <p className="text-sm text-gray-600">Hoje</p>
              </div>
            </div>
            <p className="text-gray-700 font-medium">Consultas Agendadas</p>
          </div>

          {/* Consultas Semana */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="stat-icon bg-accent-100">
                <TrendingUp className="w-6 h-6 text-accent-600" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{stats.consultas_semana}</p>
                <p className="text-sm text-gray-600">Esta Semana</p>
              </div>
            </div>
            <p className="text-gray-700 font-medium">Total de Consultas</p>
          </div>

          {/* Pacientes */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="stat-icon bg-emerald-100">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{stats.pacientes_total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
            <p className="text-gray-700 font-medium">Pacientes Atendidos</p>
          </div>

          {/* Avaliação */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="stat-icon bg-amber-100">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{stats.avaliacoes_media}</p>
                <p className="text-sm text-gray-600">de 5.0</p>
              </div>
            </div>
            <p className="text-gray-700 font-medium">Avaliação Média</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Consultas de Hoje */}
          <div className="md:col-span-2 card-elevated p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Consultas de Hoje</h2>
              <span className="badge-primary">
                {consultasHoje.length} agendadas
              </span>
            </div>

            <div className="space-y-4">
              {consultasHoje.map((consulta) => (
                <div
                  key={consulta.id}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {consulta.paciente_nome[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{consulta.paciente_nome}</p>
                        <p className="text-sm text-gray-600">{formatTime(consulta.data_consulta)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`px-3 py-1 rounded-full flex items-center space-x-1 ${getStatusColor(consulta.status)}`}>
                        {getTipoIcon(consulta.tipo_consulta)}
                        <span className="text-xs font-semibold capitalize">{consulta.tipo_consulta}</span>
                      </div>
                    </div>
                  </div>

                  {consulta.sintomas && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Motivo:</span> {consulta.sintomas}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleIniciarConsulta(consulta.id)}
                      disabled={iniciandoConsulta === consulta.id}
                      className="flex-1 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:shadow-farma transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {iniciandoConsulta === consulta.id ? (
                        <span className="flex items-center justify-center space-x-2">
                          <Activity className="w-4 h-4 animate-spin" />
                          <span>Iniciando...</span>
                        </span>
                      ) : (
                        'Iniciar Consulta'
                      )}
                    </button>
                    <button 
                      onClick={() => navigate(`/consultas?abrir=${consulta.id}`)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Ver detalhes"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => navigate(`/consultas?abrir=${consulta.id}`)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Abrir chat"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Próxima Consulta */}
            {stats.proxima_consulta && (
              <div className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl p-6 text-white shadow-farma-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="w-5 h-5" />
                  <h3 className="font-bold">Próxima Consulta</h3>
                </div>
                <div className="space-y-3">
                  <p className="text-lg font-semibold">{stats.proxima_consulta.paciente_nome}</p>
                  <p className="text-white/90 text-sm">
                    {formatTime(stats.proxima_consulta.data_consulta)}
                  </p>
                  <div className="flex items-center space-x-2">
                    {getTipoIcon(stats.proxima_consulta.tipo_consulta)}
                    <span className="text-sm capitalize">{stats.proxima_consulta.tipo_consulta}</span>
                  </div>
                  <button 
                    onClick={() => handleIniciarConsulta(stats.proxima_consulta!.id)}
                    disabled={iniciandoConsulta === stats.proxima_consulta!.id}
                    className="w-full mt-4 py-3 bg-white text-primary-600 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {iniciandoConsulta === stats.proxima_consulta!.id ? 'Iniciando...' : 'Entrar Agora'}
                  </button>
                </div>
              </div>
            )}

            {/* Ações Rápidas */}
            <div className="card-elevated p-6">
              <h3 className="font-bold text-gray-900 mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/consultas')}
                  className="w-full py-3 bg-primary-50 text-primary-700 rounded-xl hover:bg-primary-100 transition-colors flex items-center justify-center space-x-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span className="font-medium">Ver Agenda</span>
                </button>
                <button 
                  onClick={() => navigate('/consultas?tab=pacientes')}
                  className="w-full py-3 bg-accent-50 text-accent-700 rounded-xl hover:bg-accent-100 transition-colors flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">Prontuários</span>
                </button>
                <button 
                  onClick={() => navigate('/consultas?tab=prescricoes')}
                  className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center space-x-2"
                >
                  <Package className="w-4 h-4" />
                  <span className="font-medium">Receitas</span>
                </button>
              </div>
            </div>

            {/* Receita do Mês */}
            <div className="card-elevated p-6">
              <div className="flex items-center space-x-2 mb-4">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900">Receita do Mês</h3>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {stats.receita_mes.toLocaleString('pt-AO', {
                  style: 'currency',
                  currency: 'AOA',
                  minimumFractionDigits: 0
                })}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                +12% vs mês anterior
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Consulta */}
      {consultaAberta && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold">
                    {consultaAberta.paciente_nome[0]}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{consultaAberta.paciente_nome}</h2>
                  <p className="text-white/80 text-sm">
                    Consulta {consultaAberta.tipo_consulta} • {formatTime(consultaAberta.data_consulta)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleFecharConsulta}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navegação de Tabs */}
            <div className="flex border-b border-gray-200 px-6 bg-gray-50">
              <button
                onClick={() => setModoVisualizacao('opcoes')}
                className={`px-6 py-4 font-medium transition-colors relative ${
                  modoVisualizacao === 'opcoes'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Opções</span>
                </div>
              </button>
              <button
                onClick={() => setModoVisualizacao('chat')}
                className={`px-6 py-4 font-medium transition-colors relative ${
                  modoVisualizacao === 'chat'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat</span>
                </div>
              </button>
              <button
                onClick={() => setModoVisualizacao('video')}
                className={`px-6 py-4 font-medium transition-colors relative ${
                  modoVisualizacao === 'video'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Video className="w-4 h-4" />
                  <span>Videochamada</span>
                </div>
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="flex-1 overflow-hidden">
              {modoVisualizacao === 'opcoes' && (
                <div className="h-full p-8 overflow-y-auto">
                  <div className="max-w-4xl mx-auto">
                    {/* Informações da Consulta */}
                    <div className="bg-gradient-to-br from-primary-50 to-accent-50/50 rounded-2xl p-6 mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Informações da Consulta</h3>
                      {consultaAberta.sintomas && (
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Motivo/Sintomas:</p>
                          <p className="text-gray-900">{consultaAberta.sintomas}</p>
                        </div>
                      )}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Tipo de Consulta</p>
                          <div className="flex items-center space-x-2">
                            {getTipoIcon(consultaAberta.tipo_consulta)}
                            <span className="font-medium capitalize">{consultaAberta.tipo_consulta}</span>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Status</p>
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(consultaAberta.status)}`}>
                            {consultaAberta.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Opções de Comunicação */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <button
                        onClick={() => setModoVisualizacao('chat')}
                        className="bg-white border-2 border-primary-500 rounded-2xl p-8 hover:shadow-farma transition-all text-left group"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <MessageSquare className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Iniciar Chat</h3>
                        <p className="text-gray-600">
                          Converse com o paciente por mensagens de texto em tempo real
                        </p>
                      </button>

                      <button
                        onClick={() => setModoVisualizacao('video')}
                        className="bg-white border-2 border-accent-500 rounded-2xl p-8 hover:shadow-farma transition-all text-left group"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Video className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Videochamada</h3>
                        <p className="text-gray-600">
                          Realize uma consulta por vídeo com compartilhamento de tela
                        </p>
                      </button>

                      <button
                        onClick={() => navigate(`/consultas?abrir=${consultaAberta.id}&tab=prontuario`)}
                        className="bg-white border-2 border-emerald-500 rounded-2xl p-8 hover:shadow-farma transition-all text-left group"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <FileText className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Prontuário</h3>
                        <p className="text-gray-600">
                          Visualizar e editar o prontuário médico do paciente
                        </p>
                      </button>

                      <button
                        onClick={() => navigate(`/consultas?abrir=${consultaAberta.id}&tab=prescricao`)}
                        className="bg-white border-2 border-amber-500 rounded-2xl p-8 hover:shadow-farma transition-all text-left group"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Package className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Prescrição</h3>
                        <p className="text-gray-600">
                          Criar receitas e prescrições médicas para o paciente
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {modoVisualizacao === 'chat' && (
                <div className="h-full">
                  <ChatConsulta
                    consultaId={consultaAberta.id}
                    nomePaciente={consultaAberta.paciente_nome}
                  />
                </div>
              )}

              {modoVisualizacao === 'video' && (
                <div className="h-full bg-gray-900">
                  <VideoCall
                    consultaId={consultaAberta.id}
                    isInitiator={true}
                    onEnd={() => setModoVisualizacao('opcoes')}
                    onError={(error) => {
                      toast.error(error)
                      setModoVisualizacao('opcoes')
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
