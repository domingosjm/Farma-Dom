import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Truck, Users, Package, TrendingUp,
  Clock, CheckCircle, MapPin, Loader2,
  ArrowRight, RefreshCw, AlertTriangle
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { transporteService, type TransporteDashboard } from '@/services/transporteService'

export default function DashboardTransporte() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<TransporteDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await transporteService.getDashboard()
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

  const entregas = stats?.entregas
  const motoristas = stats?.motoristas
  const veiculos = stats?.veiculos
  const faturamento = stats?.faturamento

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Painel de Transporte
          </h1>
          <p className="text-gray-600">
            Olá, {user?.nome_completo?.split(' ')[0]}! Resumo das operações do mês.
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

      {/* Alert: Pending deliveries */}
      {entregas && Number(entregas.aguardando) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-amber-800 font-medium">
              {entregas.aguardando} entrega(s) aguardando atribuição de motorista
            </p>
            <p className="text-amber-600 text-sm">Atribua motoristas para agilizar as entregas</p>
          </div>
          <Link
            to="/transporte/entregas"
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-medium whitespace-nowrap"
          >
            Ver Entregas
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Package className="w-6 h-6 text-amber-600" />}
          label="Entregas Pendentes"
          value={entregas?.aguardando || 0}
          bg="bg-amber-50"
        />
        <StatCard
          icon={<Truck className="w-6 h-6 text-primary-600" />}
          label="Em Rota"
          value={Number(entregas?.aceitas || 0) + Number(entregas?.em_rota || 0)}
          bg="bg-primary-50"
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
          label="Entregues (mês)"
          value={entregas?.entregues || 0}
          bg="bg-emerald-50"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-accent-600" />}
          label="Faturamento (mês)"
          value={`${Number(faturamento?.faturamento_mes || 0).toLocaleString('pt-AO')} Kz`}
          bg="bg-accent-50"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickAction
          to="/transporte/entregas"
          icon={<Package className="w-6 h-6 text-white" />}
          label="Gerir Entregas"
          description={`${entregas?.total || 0} este mês`}
          gradient="from-amber-500 to-amber-600"
          badge={Number(entregas?.aguardando || 0)}
        />
        <QuickAction
          to="/transporte/motoristas"
          icon={<Users className="w-6 h-6 text-white" />}
          label="Motoristas"
          description={`${motoristas?.total_motoristas || 0} registados`}
          gradient="from-primary-500 to-primary-600"
        />
        <QuickAction
          to="/transporte/veiculos"
          icon={<Truck className="w-6 h-6 text-white" />}
          label="Veículos"
          description={`${veiculos?.total_veiculos || 0} veículos`}
          gradient="from-emerald-500 to-emerald-600"
        />
      </div>

      {/* Summary panels */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Entregas Resumo */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Entregas do Mês</h2>
            <Link to="/transporte/entregas" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-gray-600">Aguardando</span>
              </div>
              <span className="font-semibold">{entregas?.aguardando || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-500" />
                <span className="text-gray-600">Aceitas / Em rota</span>
              </div>
              <span className="font-semibold text-primary-600">
                {Number(entregas?.aceitas || 0)} / {Number(entregas?.em_rota || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-gray-600">Entregues</span>
              </div>
              <span className="font-semibold text-emerald-600">{entregas?.entregues || 0}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-gray-600 font-medium">Total</span>
              <span className="font-bold">{entregas?.total || 0}</span>
            </div>
          </div>
        </div>

        {/* Frota Resumo */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Frota</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-500" />
                <span className="text-gray-600">Total de motoristas</span>
              </div>
              <span className="font-semibold">{motoristas?.total_motoristas || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <span className="text-gray-600">Motoristas ativos</span>
              </div>
              <span className="font-semibold text-emerald-600">{motoristas?.motoristas_ativos || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-accent-500" />
                <span className="text-gray-600">Total de veículos</span>
              </div>
              <span className="font-semibold">{veiculos?.total_veiculos || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-500" />
                <span className="text-gray-600">Veículos ativos</span>
              </div>
              <span className="font-semibold text-emerald-600">{veiculos?.veiculos_ativos || 0}</span>
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

function StatCard({ icon, label, value, bg }: {
  icon: React.ReactNode; label: string; value: string | number; bg: string
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
