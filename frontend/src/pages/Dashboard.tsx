import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Heart, Calendar, Pill, Package, Activity, Bell, 
  TrendingUp, Clock, CheckCircle, AlertCircle,
  ArrowRight, Plus, User, Loader2
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { dashboardService, type DashboardStats } from '@/services/dashboardService'

export default function Dashboard() {
  const { user, getDashboardPath } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // Redirecionar usuários não-pacientes para seus dashboards específicos
    if (user.tipo_usuario !== 'paciente') {
      const correctDashboard = getDashboardPath()
      if (correctDashboard !== '/dashboard') {
        navigate(correctDashboard, { replace: true })
        return
      }
    }

    loadDashboardData()
  }, [user, navigate, getDashboardPath])

  const loadDashboardData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const statsData = await dashboardService.getStats()
      setStats(statsData)
    } catch (err: any) {
      console.error('Erro ao carregar dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dateStr = date.toLocaleDateString('pt-PT')
    const timeStr = date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })

    if (date.toDateString() === today.toDateString()) {
      return `Hoje às ${timeStr}`
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Amanhã às ${timeStr}`
    } else {
      return `${dateStr} às ${timeStr}`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50/30">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-700 via-primary-500 to-accent-600 rounded-xl flex items-center justify-center shadow-farma">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-baseline">
                  <span className="text-xl font-bold text-primary-700">Farma</span>
                  <span className="text-xl font-bold text-accent-600">Dom</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2.5 hover:bg-gray-100 rounded-xl transition">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>
              <Link to="/perfil" className="flex items-center gap-3 hover:bg-gray-100 rounded-xl pr-4 pl-2 py-2 transition">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.nome_completo || 'Usuário'}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Olá, {user?.nome_completo?.split(' ')[0] || 'Bem-vindo'}! 👋
          </h1>
          <p className="text-gray-600">Aqui está o resumo da sua saúde hoje</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Consultas Agendadas */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="stat-icon bg-primary-100">
                <Calendar className="w-6 h-6 text-primary-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.consultas_pendentes || 0}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Consultas Agendadas</h3>
            <p className="text-xs text-gray-500">
              {stats?.proxima_consulta ? formatDateTime(stats.proxima_consulta.data_hora_agendada) : 'Nenhuma agendada'}
            </p>
          </div>

          {/* Medicamentos */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="stat-icon bg-accent-100">
                <Pill className="w-6 h-6 text-accent-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">0</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Medicamentos Ativos</h3>
            <p className="text-xs text-gray-500">Receitas ativas</p>
          </div>

          {/* Pacote */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="stat-icon bg-emerald-100">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
              {stats?.assinatura_ativa ? (
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              ) : (
                <AlertCircle className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Pacote de Saúde</h3>
            <p className="text-xs text-gray-500">
              {stats?.assinatura_ativa ? (stats.assinatura_ativa.pacote_nome || 'Plano ativo') : 'Sem plano'}
            </p>
          </div>

          {/* Saúde */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="stat-icon bg-rose-100">
                <Activity className="w-6 h-6 text-rose-600" />
              </div>
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Consultas Realizadas</h3>
            <p className="text-xs text-gray-500">{stats?.consultas_concluidas || 0} total</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="card-elevated">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Ações Rápidas</h2>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/consultas"
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl hover:shadow-farma transition group border border-primary-100"
                >
                  <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Agendar Consulta</h3>
                    <p className="text-xs text-gray-600">Online ou domicílio</p>
                  </div>
                </Link>

                <Link
                  to="/medicamentos"
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl hover:shadow-farma transition group border border-accent-100"
                >
                  <div className="w-12 h-12 bg-accent-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                    <Pill className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Comprar Remédios</h3>
                    <p className="text-xs text-gray-600">Entrega rápida</p>
                  </div>
                </Link>

                <Link
                  to="/historico-medico"
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl hover:shadow-farma transition group border border-emerald-100"
                >
                  <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Histórico Médico</h3>
                    <p className="text-xs text-gray-600">Seus dados</p>
                  </div>
                </Link>

                <Link
                  to="/pacotes"
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl hover:shadow-farma transition group border border-rose-100"
                >
                  <div className="w-12 h-12 bg-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Ver Pacotes</h3>
                    <p className="text-xs text-gray-600">Planos de saúde</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Próximas Consultas */}
            <div className="card-elevated">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Próximas Consultas</h2>
                <Link to="/consultas" className="text-sm text-primary-600 hover:text-accent-600 font-medium flex items-center gap-1 transition">
                  <span>Ver todas</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-4">
                {stats?.proxima_consulta ? (
                  <div 
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl border border-primary-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {stats.proxima_consulta.especialidade || 'Consulta'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {stats.proxima_consulta.tipo_consulta === 'online' ? 'Online' : 'Domiciliar'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDateTime(stats.proxima_consulta.data_hora_agendada)}</span>
                        </p>
                      </div>
                    </div>
                    <Link 
                      to="/consultas"
                      state={{ abrirConsulta: stats.proxima_consulta.id }}
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      Entrar
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium mb-2">Nenhuma consulta agendada</p>
                    <p className="text-sm text-gray-500 mb-4">Agende sua primeira consulta!</p>
                    <Link
                      to="/consultas"
                      className="btn-gradient px-4 py-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agendar Consulta</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Health Tips */}
            <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 rounded-2xl p-6 text-white shadow-farma-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">Dica do Dia</h3>
              </div>
              <p className="text-sm text-primary-100 mb-4">
                Beba pelo menos 2 litros de água por dia para manter-se hidratado e saudável!
              </p>
              <button className="text-xs font-semibold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">
                Mais dicas
              </button>
            </div>

            {/* Alerts */}
            <div className="card-elevated">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-gray-900">Lembretes</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Tomar medicamento</p>
                    <p className="text-xs text-gray-600">Losartana 50mg - 20:00</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Medicamento tomado</p>
                    <p className="text-xs text-gray-600">Omeprazol 20mg - 08:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
