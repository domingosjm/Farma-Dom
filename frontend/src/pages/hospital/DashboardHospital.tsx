import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Stethoscope, TrendingUp,
  Calendar, Clock, CheckCircle, Loader2,
  BarChart3, ArrowRight, RefreshCw, Activity
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { hospitalService, type HospitalDashboard } from '@/services/hospitalService'

export default function DashboardHospital() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<HospitalDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await hospitalService.getDashboard()
      setStats(data)
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    )
  }

  const medicos = stats?.medicos
  const consultas = stats?.consultas
  const faturamento = stats?.faturamento

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Painel do Hospital
          </h1>
          <p className="text-gray-600">
            Olá, {user?.nome_completo?.split(' ')[0]}! Resumo do mês corrente.
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition self-start"
          title="Atualizar dados"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-6 h-6 text-primary-600" />}
          label="Total de Médicos"
          value={medicos?.total_medicos || 0}
          sub={`${medicos?.medicos_ativos || 0} ativos`}
          bg="bg-primary-50"
        />
        <StatCard
          icon={<Calendar className="w-6 h-6 text-farma-cyan-500" />}
          label="Consultas (mês)"
          value={consultas?.total_consultas || 0}
          sub={`${consultas?.consultas_agendadas || 0} agendadas`}
          bg="bg-farma-cyan-50"
        />
        <StatCard
          icon={<Activity className="w-6 h-6 text-emerald-600" />}
          label="Concluídas (mês)"
          value={consultas?.consultas_concluidas || 0}
          sub={`${consultas?.consultas_em_andamento || 0} em andamento`}
          bg="bg-emerald-50"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-accent-600" />}
          label="Receita Hospital"
          value={`${Number(faturamento?.receita_hospital || 0).toLocaleString('pt-AO')} Kz`}
          sub={`Bruta: ${Number(faturamento?.receita_bruta || 0).toLocaleString('pt-AO')} Kz`}
          bg="bg-accent-50"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickAction
          to="/hospital/medicos"
          icon={<Stethoscope className="w-6 h-6 text-white" />}
          label="Gerir Médicos"
          description={`${medicos?.total_medicos || 0} médicos vinculados`}
          gradient="from-primary-500 to-primary-600"
        />
        <QuickAction
          to="/hospital/consultas"
          icon={<Calendar className="w-6 h-6 text-white" />}
          label="Consultas"
          description={`${consultas?.consultas_agendadas || 0} agendadas`}
          gradient="from-farma-cyan-500 to-farma-cyan-600"
          badge={Number(consultas?.consultas_em_andamento || 0)}
        />
        <QuickAction
          to="/hospital/relatorios"
          icon={<BarChart3 className="w-6 h-6 text-white" />}
          label="Relatórios"
          description="Financeiro e médicos"
          gradient="from-accent-500 to-accent-600"
        />
      </div>

      {/* Summary panels */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Consultas Resumo */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Consultas do Mês</h2>
            <Link to="/hospital/consultas" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-gray-600">Agendadas</span>
              </div>
              <span className="font-semibold">{consultas?.consultas_agendadas || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-500" />
                <span className="text-gray-600">Em andamento</span>
              </div>
              <span className="font-semibold text-primary-600">{consultas?.consultas_em_andamento || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-gray-600">Concluídas</span>
              </div>
              <span className="font-semibold text-green-600">{consultas?.consultas_concluidas || 0}</span>
            </div>
          </div>
        </div>

        {/* Faturamento Resumo */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Faturamento do Mês</h2>
            <Link to="/hospital/relatorios" className="text-sm text-accent-600 hover:text-accent-700 flex items-center gap-1">
              Relatório <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Receita bruta</span>
              <span className="font-semibold">{Number(faturamento?.receita_bruta || 0).toLocaleString('pt-AO')} Kz</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Parte do hospital</span>
              <span className="font-semibold text-green-600">{Number(faturamento?.receita_hospital || 0).toLocaleString('pt-AO')} Kz</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Consultas concluídas</span>
              <span className="font-semibold">{faturamento?.consultas_concluidas_mes || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Sub-components
// ============================================

function StatCard({ icon, label, value, sub, bg }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; bg: string
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-3 mb-3">
        <div className={`stat-icon ${bg}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function QuickAction({ to, icon, label, description, gradient, badge }: {
  to: string; icon: React.ReactNode; label: string; description: string; gradient: string; badge?: number
}) {
  return (
    <Link
      to={to}
      className={`relative bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white hover:shadow-farma transition-all transform hover:-translate-y-0.5`}
    >
      {badge ? (
        <span className="absolute top-3 right-3 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
      <div className="mb-3">{icon}</div>
      <h3 className="font-semibold">{label}</h3>
      <p className="text-sm opacity-80">{description}</p>
    </Link>
  )
}
