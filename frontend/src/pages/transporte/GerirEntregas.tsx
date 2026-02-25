import { useEffect, useState } from 'react'
import {
  Package, Truck, MapPin, Clock, User,
  ChevronLeft, ChevronRight, Loader2, X, AlertCircle, RefreshCw
} from 'lucide-react'
import {
  transporteService,
  type EntregaTransporte,
  type Motorista,
  type Veiculo
} from '@/services/transporteService'

const STATUS_TABS = [
  { key: 'todas', label: 'Todas' },
  { key: 'pendente', label: 'Pendente' },
  { key: 'atribuida', label: 'Atribuída' },
  { key: 'em_transito', label: 'Em Trânsito' },
  { key: 'entregue', label: 'Entregue' },
  { key: 'cancelada', label: 'Cancelada' },
] as const

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  atribuida: 'bg-blue-100 text-blue-800',
  em_transito: 'bg-purple-100 text-purple-800',
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

export default function GerirEntregas() {
  const [entregas, setEntregas] = useState<EntregaTransporte[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [statusFilter, setStatusFilter] = useState('todas')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})

  // Modal state
  const [atribuirModal, setAtribuirModal] = useState<EntregaTransporte | null>(null)
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [selectedMotorista, setSelectedMotorista] = useState('')
  const [selectedVeiculo, setSelectedVeiculo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadEntregas()
  }, [statusFilter, page])

  useEffect(() => {
    loadCounts()
  }, [])

  const loadCounts = async () => {
    try {
      const allStatuses = ['pendente', 'atribuida', 'em_transito', 'entregue', 'cancelada']
      const results = await Promise.all(
        allStatuses.map(s => transporteService.getEntregas({ status: s, limit: 1 }))
      )
      const newCounts: Record<string, number> = {}
      allStatuses.forEach((s, i) => {
        newCounts[s] = results[i].total
      })
      setCounts(newCounts)
    } catch {
      // counts are supplementary, ignore errors
    }
  }

  const loadEntregas = async () => {
    try {
      setLoading(true)
      setError(null)
      const params: { status?: string; page: number; limit: number } = { page, limit }
      if (statusFilter !== 'todas') params.status = statusFilter
      const data = await transporteService.getEntregas(params)
      setEntregas(data.items)
      setTotal(data.total)
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar entregas')
    } finally {
      setLoading(false)
    }
  }

  const openAtribuirModal = async (entrega: EntregaTransporte) => {
    setAtribuirModal(entrega)
    setSelectedMotorista('')
    setSelectedVeiculo('')
    try {
      const [m, v] = await Promise.all([
        transporteService.getMotoristas(),
        transporteService.getVeiculos(),
      ])
      setMotoristas(m)
      setVeiculos(v.filter(ve => ve.is_ativo))
    } catch {
      // fallback
    }
  }

  const handleAtribuir = async () => {
    if (!atribuirModal || !selectedMotorista) return
    try {
      setSubmitting(true)
      await transporteService.atribuirEntrega(atribuirModal.id, {
        motorista_id: selectedMotorista,
        veiculo_id: selectedVeiculo || undefined,
      })
      setAtribuirModal(null)
      loadEntregas()
      loadCounts()
    } catch (err: any) {
      alert(err?.message || 'Erro ao atribuir entrega')
    } finally {
      setSubmitting(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  const formatDate = (d?: string) => {
    if (!d) return '—'
    return new Date(d).toLocaleString('pt-AO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerir Entregas</h1>
          <p className="text-gray-600">Acompanhe e atribua entregas aos motoristas</p>
        </div>
        <button
          onClick={() => { loadEntregas(); loadCounts() }}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition self-start"
          title="Atualizar"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map(tab => {
          const active = statusFilter === tab.key
          const count = tab.key === 'todas'
            ? Object.values(counts).reduce((a, b) => a + b, 0)
            : counts[tab.key] ?? 0
          return (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(1) }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-2 ${
                active
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              <span className={`text-xs rounded-full px-2 py-0.5 ${
                active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      ) : entregas.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma entrega encontrada</p>
        </div>
      ) : (
        <>
          {/* Cards */}
          <div className="grid gap-4">
            {entregas.map(entrega => (
              <div
                key={entrega.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Left info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-gray-900">
                        Pedido #{entrega.numero_pedido || entrega.pedido_id?.slice(0, 8)}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[entrega.status] || 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[entrega.status] || entrega.status}
                      </span>
                      {entrega.valor_entrega > 0 && (
                        <span className="text-sm text-gray-500">
                          {Number(entrega.valor_entrega).toLocaleString('pt-AO')} Kz
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-orange-500" />
                        {entrega.farmacia_nome}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-blue-500" />
                        {entrega.cliente_nome}
                      </span>
                      {entrega.endereco_entrega && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-red-500" />
                          {entrega.endereco_entrega}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Criado: {formatDate(entrega.created_at)}
                      </span>
                      {entrega.entregue_em && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Entregue: {formatDate(entrega.entregue_em)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: driver + action */}
                  <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <span className={entrega.motorista_nome ? 'text-gray-700 font-medium' : 'text-gray-400 italic'}>
                        {entrega.motorista_nome || 'Não atribuído'}
                      </span>
                    </div>

                    {entrega.status === 'pendente' && (
                      <button
                        onClick={() => openAtribuirModal(entrega)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition whitespace-nowrap"
                      >
                        Atribuir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-3">
              <p className="text-sm text-gray-500">
                Mostrando {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Atribuir Modal */}
      {atribuirModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setAtribuirModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Atribuir Entrega</h2>
            <p className="text-sm text-gray-500 mb-5">
              Pedido #{atribuirModal.numero_pedido || atribuirModal.pedido_id?.slice(0, 8)} — {atribuirModal.farmacia_nome}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motorista <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedMotorista}
                  onChange={e => setSelectedMotorista(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                >
                  <option value="">Selecionar motorista…</option>
                  {motoristas.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nome_completo} {m.entregas_ativas > 0 ? `(${m.entregas_ativas} ativas)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Veículo <span className="text-gray-400">(opcional)</span>
                </label>
                <select
                  value={selectedVeiculo}
                  onChange={e => setSelectedVeiculo(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                >
                  <option value="">Nenhum veículo</option>
                  {veiculos.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.placa} — {v.modelo} {v.tipo ? `(${v.tipo})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setAtribuirModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleAtribuir}
                disabled={!selectedMotorista || submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Atribuir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
