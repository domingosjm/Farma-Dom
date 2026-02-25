import { useEffect, useState, useCallback } from 'react'
import {
  ShoppingCart, Clock, CheckCircle, XCircle, Package,
  Loader2, ChevronLeft, ChevronRight, MapPin, Phone,
  User, AlertTriangle, Pill, Truck, Eye, X
} from 'lucide-react'
import { farmaciaService, type PedidoFarmacia } from '@/services/farmaciaService'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  aguardando_farmacia: { label: 'Aguardando', color: 'text-amber-700', bg: 'bg-amber-100', icon: <Clock className="w-4 h-4" /> },
  em_preparacao: { label: 'Preparando', color: 'text-primary-700', bg: 'bg-primary-100', icon: <Package className="w-4 h-4" /> },
  pronto_entrega: { label: 'Pronto', color: 'text-accent-700', bg: 'bg-accent-100', icon: <CheckCircle className="w-4 h-4" /> },
  em_transito: { label: 'Em trânsito', color: 'text-cyan-700', bg: 'bg-cyan-100', icon: <Truck className="w-4 h-4" /> },
  entregue: { label: 'Entregue', color: 'text-green-700', bg: 'bg-green-100', icon: <CheckCircle className="w-4 h-4" /> },
  cancelado: { label: 'Cancelado', color: 'text-red-700', bg: 'bg-red-100', icon: <XCircle className="w-4 h-4" /> },
}

export default function GerirPedidos() {
  const [pedidos, setPedidos] = useState<PedidoFarmacia[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedPedido, setSelectedPedido] = useState<PedidoFarmacia | null>(null)
  const [recusaMotivo, setRecusaMotivo] = useState('')
  const [showRecusaModal, setShowRecusaModal] = useState<string | null>(null)

  const LIMIT = 15

  const loadPedidos = useCallback(async () => {
    try {
      setLoading(true)
      const result = await farmaciaService.getPedidos({
        status: statusFilter || undefined,
        page,
        limit: LIMIT
      })
      setPedidos(result.items)
      setTotal(result.total)
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    loadPedidos()
  }, [loadPedidos])

  const handleAceitar = async (id: string) => {
    try {
      setActionLoading(id)
      await farmaciaService.aceitarPedido(id)
      loadPedidos()
    } catch (err) {
      console.error('Erro ao aceitar pedido:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRecusar = async (id: string) => {
    if (recusaMotivo.length < 5) return
    try {
      setActionLoading(id)
      await farmaciaService.recusarPedido(id, recusaMotivo)
      setShowRecusaModal(null)
      setRecusaMotivo('')
      loadPedidos()
    } catch (err) {
      console.error('Erro ao recusar pedido:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarcarPronto = async (id: string) => {
    try {
      setActionLoading(id)
      await farmaciaService.marcarPronto(id)
      loadPedidos()
    } catch (err) {
      console.error('Erro ao marcar como pronto:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const viewDetails = async (id: string) => {
    try {
      const pedido = await farmaciaService.getPedido(id)
      setSelectedPedido(pedido)
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err)
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gerir Pedidos</h1>
        <p className="text-gray-600">{total} pedido(s) encontrado(s)</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: '', label: 'Todos' },
          { value: 'aguardando_farmacia', label: 'Aguardando' },
          { value: 'em_preparacao', label: 'Preparando' },
          { value: 'pronto_entrega', label: 'Prontos' },
          { value: 'em_transito', label: 'Em Trânsito' },
          { value: 'entregue', label: 'Entregues' },
          { value: 'cancelado', label: 'Cancelados' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1) }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              statusFilter === tab.value
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pedidos List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : pedidos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map(pedido => {
            const statusInfo = STATUS_CONFIG[pedido.status] || { label: pedido.status, color: 'text-gray-600', bg: 'bg-gray-100', icon: null }
            const isAwaiting = pedido.status === 'aguardando_farmacia'
            const isPreparing = pedido.status === 'em_preparacao'

            return (
              <div key={pedido.id} className={`bg-white rounded-xl shadow-sm border ${isAwaiting ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-100'} overflow-hidden`}>
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-gray-900">#{pedido.numero_pedido}</h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(pedido.created_at).toLocaleString('pt-PT')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        {Number(pedido.total).toLocaleString('pt-AO')} Kz
                      </p>
                      {pedido.parcelado && (
                        <p className="text-xs text-accent-600">{pedido.numero_parcelas}x parcelas</p>
                      )}
                    </div>
                  </div>

                  {/* Client info */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      {pedido.cliente_nome}
                    </div>
                    {pedido.cliente_telefone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4" />
                        {pedido.cliente_telefone}
                      </div>
                    )}
                    {pedido.zona_entrega && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {pedido.zona_entrega}
                      </div>
                    )}
                  </div>

                  {/* Items preview */}
                  {pedido.itens && pedido.itens.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {pedido.itens.slice(0, 3).map((item, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 text-xs px-2.5 py-1 rounded-lg">
                          <Pill className="w-3 h-3 text-green-500" />
                          {item.nome} x{item.quantidade}
                        </span>
                      ))}
                      {pedido.itens.length > 3 && (
                        <span className="text-xs text-gray-400">+{pedido.itens.length - 3} mais</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => viewDetails(pedido.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition"
                    >
                      <Eye className="w-4 h-4" />
                      Detalhes
                    </button>

                    {isAwaiting && (
                      <>
                        <button
                          onClick={() => handleAceitar(pedido.id)}
                          disabled={actionLoading === pedido.id}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                          {actionLoading === pedido.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Aceitar
                        </button>
                        <button
                          onClick={() => setShowRecusaModal(pedido.id)}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-100 transition"
                        >
                          <XCircle className="w-4 h-4" />
                          Recusar
                        </button>
                      </>
                    )}

                    {isPreparing && (
                      <button
                        onClick={() => handleMarcarPronto(pedido.id)}
                        disabled={actionLoading === pedido.id}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-accent-600 text-white rounded-lg text-sm hover:bg-accent-700 transition disabled:opacity-50"
                      >
                        {actionLoading === pedido.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                        Marcar Pronto
                      </button>
                    )}

                    {pedido.itens?.some(item => item.requer_receita) && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 ml-auto">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Requer receita
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Página {page} de {totalPages} ({total} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Recusa Modal */}
      {showRecusaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Motivo da Recusa</h3>
            <p className="text-sm text-gray-600 mb-4">
              Recusar um pedido impacta sua posição no rodízio. Informe o motivo:
            </p>
            <textarea
              value={recusaMotivo}
              onChange={(e) => setRecusaMotivo(e.target.value)}
              placeholder="Ex: Medicamento em falta no momento..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 resize-none h-24"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setShowRecusaModal(null); setRecusaMotivo('') }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRecusar(showRecusaModal)}
                disabled={recusaMotivo.length < 5 || actionLoading === showRecusaModal}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {actionLoading === showRecusaModal ? 'Recusando...' : 'Confirmar Recusa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pedido Detail Modal */}
      {selectedPedido && (
        <PedidoDetailModal
          pedido={selectedPedido}
          onClose={() => setSelectedPedido(null)}
        />
      )}
    </div>
  )
}

// ============================================
// Detail Modal
// ============================================

function PedidoDetailModal({ pedido, onClose }: { pedido: PedidoFarmacia; onClose: () => void }) {
  const statusInfo = STATUS_CONFIG[pedido.status] || { label: pedido.status, color: 'text-gray-600', bg: 'bg-gray-100', icon: null }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold">Pedido #{pedido.numero_pedido}</h2>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
              {statusInfo.icon}
              {statusInfo.label}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Cliente */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Cliente</h3>
            <div className="space-y-1.5">
              <p className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /> {pedido.cliente_nome}</p>
              {pedido.cliente_telefone && (
                <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> {pedido.cliente_telefone}</p>
              )}
              {pedido.endereco_entrega && (
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> {pedido.endereco_entrega}</p>
              )}
            </div>
          </div>

          {/* Itens */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Itens do Pedido</h3>
            <div className="space-y-2">
              {pedido.itens?.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.nome}</p>
                    <p className="text-xs text-gray-500">
                      {item.dosagem} {item.forma_farmaceutica && `• ${item.forma_farmaceutica}`}
                      {item.requer_receita && ' • 📋 Receita'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{Number(item.preco_unitario).toLocaleString('pt-AO')} Kz</p>
                    <p className="text-xs text-gray-500">x{item.quantidade}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totais */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{Number(pedido.subtotal).toLocaleString('pt-AO')} Kz</span>
            </div>
            {Number(pedido.taxa_entrega) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taxa de entrega</span>
                <span>{Number(pedido.taxa_entrega).toLocaleString('pt-AO')} Kz</span>
              </div>
            )}
            {Number(pedido.desconto) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Desconto</span>
                <span className="text-green-600">-{Number(pedido.desconto).toLocaleString('pt-AO')} Kz</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>{Number(pedido.total).toLocaleString('pt-AO')} Kz</span>
            </div>
            {pedido.parcelado && (
              <p className="text-sm text-accent-600 text-right">{pedido.numero_parcelas}x de {(Number(pedido.total) / pedido.numero_parcelas).toLocaleString('pt-AO')} Kz</p>
            )}
          </div>

          {/* Entrega */}
          {pedido.entrega && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Entrega</h3>
              <div className="bg-primary-50 rounded-lg p-3 space-y-1">
                <p className="text-sm"><span className="text-gray-500">Status:</span> {pedido.entrega.status}</p>
                {pedido.entrega.motorista_nome && (
                  <p className="text-sm"><span className="text-gray-500">Motorista:</span> {pedido.entrega.motorista_nome}</p>
                )}
                {pedido.entrega.motorista_telefone && (
                  <p className="text-sm"><span className="text-gray-500">Telefone:</span> {pedido.entrega.motorista_telefone}</p>
                )}
              </div>
            </div>
          )}

          {pedido.observacoes && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Observações</h3>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{pedido.observacoes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
