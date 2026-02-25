import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingCart, AlertTriangle, TrendingUp,
  Clock, CheckCircle, XCircle, Loader2, Power, PowerOff,
  BarChart3, Users, Pill, ArrowRight, Bell, RefreshCw
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { farmaciaService, type FarmaciaDashboard, type FarmaciaPerfil } from '@/services/farmaciaService'

export default function DashboardFarmacia() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<FarmaciaDashboard | null>(null)
  const [perfil, setPerfil] = useState<FarmaciaPerfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [togglingOnline, setTogglingOnline] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [dashData, perfilData] = await Promise.all([
        farmaciaService.getDashboard(),
        farmaciaService.getPerfil()
      ])
      setStats(dashData)
      setPerfil(perfilData)
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleOnline = async () => {
    if (!perfil) return
    try {
      setTogglingOnline(true)
      const result = await farmaciaService.setOnline(!perfil.is_online)
      setPerfil(prev => prev ? { ...prev, is_online: result.is_online } : prev)
    } catch (err) {
      console.error('Erro ao alterar status:', err)
    } finally {
      setTogglingOnline(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    )
  }

  const pedidos = stats?.pedidos
  const estoque = stats?.estoque
  const faturamento = stats?.faturamento

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {perfil?.nome || 'Minha Farmácia'}
          </h1>
          <p className="text-gray-600">
            Olá, {user?.nome_completo?.split(' ')[0]}! Aqui está o resumo de hoje.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="Atualizar dados"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={toggleOnline}
            disabled={togglingOnline}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition ${
              perfil?.is_online
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {togglingOnline ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : perfil?.is_online ? (
              <Power className="w-4 h-4" />
            ) : (
              <PowerOff className="w-4 h-4" />
            )}
            {perfil?.is_online ? 'Online' : 'Offline'}
          </button>
        </div>
      </div>

      {/* Alert: Pending orders */}
      {pedidos && Number(pedidos.pedidos_pendentes) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Bell className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-amber-800 font-medium">
              Você tem {pedidos.pedidos_pendentes} pedido(s) aguardando aceitação
            </p>
            <p className="text-amber-600 text-sm">Responda rapidamente para manter boa reputação no rodízio</p>
          </div>
          <Link
            to="/farmacia/pedidos"
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-medium whitespace-nowrap"
          >
            Ver Pedidos
          </Link>
        </div>
      )}

      {/* Alert: Low stock */}
      {estoque && Number(estoque.estoque_baixo) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">
              {estoque.estoque_baixo} produto(s) com estoque baixo
              {Number(estoque.sem_estoque) > 0 && `, ${estoque.sem_estoque} sem estoque`}
            </p>
          </div>
          <Link
            to="/farmacia/estoque?baixo_estoque=true"
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium whitespace-nowrap"
          >
            Ver Estoque
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<ShoppingCart className="w-6 h-6 text-primary-600" />}
          label="Pedidos Pendentes"
          value={pedidos?.pedidos_pendentes || 0}
          bg="bg-primary-50"
        />
        <StatCard
          icon={<Clock className="w-6 h-6 text-yellow-600" />}
          label="Em Preparação"
          value={pedidos?.pedidos_preparando || 0}
          bg="bg-yellow-50"
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          label="Entregues (mês)"
          value={pedidos?.pedidos_entregues || 0}
          bg="bg-green-50"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-accent-600" />}
          label="Faturamento (mês)"
          value={`${Number(faturamento?.faturamento_mes || 0).toLocaleString('pt-AO')} Kz`}
          bg="bg-accent-50"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction
          to="/farmacia/pedidos"
          icon={<ShoppingCart className="w-6 h-6 text-white" />}
          label="Gerir Pedidos"
          description="Aceitar e preparar"
          gradient="from-primary-500 to-primary-600"
          badge={Number(pedidos?.pedidos_pendentes || 0)}
        />
        <QuickAction
          to="/farmacia/estoque"
          icon={<Pill className="w-6 h-6 text-white" />}
          label="Gestão de Estoque"
          description={`${estoque?.total_produtos || 0} produtos`}
          gradient="from-emerald-500 to-emerald-600"
        />
        <QuickAction
          to="/farmacia/relatorios"
          icon={<BarChart3 className="w-6 h-6 text-white" />}
          label="Relatórios"
          description="Vendas e análises"
          gradient="from-accent-500 to-accent-600"
        />
        <QuickAction
          to="/farmacia/funcionarios"
          icon={<Users className="w-6 h-6 text-white" />}
          label="Funcionários"
          description="Equipa da farmácia"
          gradient="from-amber-500 to-amber-600"
        />
      </div>

      {/* Rodízio & Estoque side by side */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Estoque Resumo */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Resumo de Estoque</h2>
            <Link to="/farmacia/estoque" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Ver tudo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total de produtos</span>
              <span className="font-semibold">{estoque?.total_produtos || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-600">Estoque baixo</span>
              <span className="font-semibold text-yellow-600">{estoque?.estoque_baixo || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-red-600">Sem estoque</span>
              <span className="font-semibold text-red-600">{estoque?.sem_estoque || 0}</span>
            </div>
          </div>
        </div>

        {/* Rodízio Resumo */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Rodízio (mês)</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-600">Pendentes</span>
              </div>
              <span className="font-semibold">{stats?.rodizio?.rodizio_pendentes || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">Aceitos</span>
              </div>
              <span className="font-semibold text-green-600">{stats?.rodizio?.rodizio_aceitos || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-gray-600">Recusados</span>
              </div>
              <span className="font-semibold text-red-600">{stats?.rodizio?.rodizio_recusados || 0}</span>
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

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string | number; bg: string }) {
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
