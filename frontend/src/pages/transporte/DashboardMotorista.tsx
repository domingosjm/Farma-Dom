import { useEffect, useState } from 'react'
import {
  Package, MapPin, CheckCircle, Clock,
  Truck, Camera, Loader2, AlertCircle,
  RefreshCw, X, Navigation
} from 'lucide-react'
import { transporteService, type EntregaTransporte } from '@/services/transporteService'

const STATUS_PRIORITY: Record<string, number> = {
  em_transito: 0,
  atribuida: 1,
  pendente: 2,
  entregue: 3,
  cancelada: 4,
}

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  atribuida: 'bg-primary-100 text-primary-800',
  em_transito: 'bg-accent-100 text-accent-800',
  entregue: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  atribuida: 'Atribuída',
  em_transito: 'Em Trânsito',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
}

export default function DashboardMotorista() {
  const [entregas, setEntregas] = useState<EntregaTransporte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Entregar modal
  const [entregarTarget, setEntregarTarget] = useState<EntregaTransporte | null>(null)
  const [entregarForm, setEntregarForm] = useState({ foto_comprovante: '', observacoes: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadEntregas()
  }, [])

  const loadEntregas = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await transporteService.getMinhasEntregas()
      // Sort by status priority
      data.sort((a, b) => (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99))
      setEntregas(data)
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar entregas')
    } finally {
      setLoading(false)
    }
  }

  const handleRecolher = async (id: string) => {
    try {
      setActionLoading(id)
      await transporteService.recolherEntrega(id)
      loadEntregas()
    } catch (err: any) {
      alert(err?.message || 'Erro ao recolher entrega')
    } finally {
      setActionLoading(null)
    }
  }

  const handleEntregar = async () => {
    if (!entregarTarget) return
    try {
      setSubmitting(true)
      await transporteService.entregarPedido(entregarTarget.id, {
        foto_comprovante: entregarForm.foto_comprovante.trim() || undefined,
        observacoes: entregarForm.observacoes.trim() || undefined,
      })
      setEntregarTarget(null)
      setEntregarForm({ foto_comprovante: '', observacoes: '' })
      loadEntregas()
    } catch (err: any) {
      alert(err?.message || 'Erro ao registar entrega')
    } finally {
      setSubmitting(false)
    }
  }

  // Stats
  const pending = entregas.filter(e => e.status === 'atribuida').length
  const inTransit = entregas.filter(e => e.status === 'em_transito').length
  const completedToday = entregas.filter(e => {
    if (e.status !== 'entregue' || !e.entregue_em) return false
    const today = new Date().toDateString()
    return new Date(e.entregue_em).toDateString() === today
  }).length
  const completedTotal = entregas.filter(e => e.status === 'entregue').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Entregas</h1>
          <p className="text-gray-600">Painel do motorista</p>
        </div>
        <button
          onClick={loadEntregas}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition self-start"
          title="Atualizar"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock className="w-6 h-6 text-primary-600" />}
          label="Pendentes"
          value={pending}
          bg="bg-primary-50"
        />
        <StatCard
          icon={<Truck className="w-6 h-6 text-accent-600" />}
          label="Em Trânsito"
          value={inTransit}
          bg="bg-accent-50"
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
          label="Entregues Hoje"
          value={completedToday}
          bg="bg-emerald-50"
        />
        <StatCard
          icon={<Package className="w-6 h-6 text-amber-600" />}
          label="Total Entregues"
          value={completedTotal}
          bg="bg-amber-50"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      ) : entregas.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma entrega atribuída</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entregas.map(entrega => (
            <div
              key={entrega.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
            >
              <div className="flex flex-col gap-3">
                {/* Top row */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">
                      Pedido #{entrega.numero_pedido || entrega.pedido_id?.slice(0, 8)}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[entrega.status] || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABELS[entrega.status] || entrega.status}
                    </span>
                  </div>
                  {entrega.valor_entrega > 0 && (
                    <span className="text-sm font-semibold text-gray-700">
                      {Number(entrega.valor_entrega).toLocaleString('pt-AO')} Kz
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-orange-500" />
                    {entrega.farmacia_nome}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-red-500" />
                    {entrega.cliente_nome}
                    {entrega.endereco_entrega && ` — ${entrega.endereco_entrega}`}
                  </span>
                </div>

                {/* Timestamps */}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Criado: {new Date(entrega.created_at).toLocaleString('pt-AO', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  {entrega.recolhido_em && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Recolhido: {new Date(entrega.recolhido_em).toLocaleString('pt-AO', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  {entrega.status === 'atribuida' && (
                    <button
                      onClick={() => handleRecolher(entrega.id)}
                      disabled={actionLoading === entrega.id}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {actionLoading === entrega.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Truck className="w-4 h-4" />
                      )}
                      Recolher na Farmácia
                    </button>
                  )}

                  {entrega.status === 'em_transito' && (
                    <>
                      <button
                        onClick={() => {
                          setEntregarTarget(entrega)
                          setEntregarForm({ foto_comprovante: '', observacoes: '' })
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Marcar como Entregue
                      </button>
                      <button
                        disabled
                        title="Atualização de GPS — funcionalidade futura"
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-400 text-sm rounded-lg cursor-not-allowed"
                      >
                        <Navigation className="w-4 h-4" />
                        GPS
                      </button>
                    </>
                  )}

                  {(entrega.status === 'entregue' || entrega.status === 'cancelada') && (
                    <span className="text-xs text-gray-400 italic">Sem ações disponíveis</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Entregar Modal */}
      {entregarTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setEntregarTarget(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Confirmar Entrega</h2>
            <p className="text-sm text-gray-500 mb-5">
              Pedido #{entregarTarget.numero_pedido || entregarTarget.pedido_id?.slice(0, 8)} — {entregarTarget.cliente_nome}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4" />
                    Foto Comprovante (URL)
                  </span>
                </label>
                <input
                  type="url"
                  value={entregarForm.foto_comprovante}
                  onChange={e => setEntregarForm(f => ({ ...f, foto_comprovante: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="https://exemplo.com/foto.jpg (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={entregarForm.observacoes}
                  onChange={e => setEntregarForm(f => ({ ...f, observacoes: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                  placeholder="Observações sobre a entrega (opcional)"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEntregarTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleEntregar}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar Entrega
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Sub-components
// ============================================

function StatCard({ icon, label, value, bg }: {
  icon: React.ReactNode; label: string; value: number; bg: string
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
