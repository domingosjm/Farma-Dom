import { useEffect, useState, useCallback } from 'react'
import {
  Search, Plus, Pill, AlertTriangle, Edit3, Trash2,
  Loader2, ChevronLeft, ChevronRight, Package, Save, X
} from 'lucide-react'
import { farmaciaService, type EstoqueItem } from '@/services/farmaciaService'

export default function GestaoEstoque() {
  const [items, setItems] = useState<EstoqueItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('')
  const [baixoEstoque, setBaixoEstoque] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ quantidade: 0, preco_farmacia: '' })
  const [showAddModal, setShowAddModal] = useState(false)

  const LIMIT = 20

  const loadEstoque = useCallback(async () => {
    try {
      setLoading(true)
      const result = await farmaciaService.getEstoque({
        search: search || undefined,
        categoria: categoria || undefined,
        baixo_estoque: baixoEstoque || undefined,
        page,
        limit: LIMIT
      })
      setItems(result.items)
      setTotal(result.total)
    } catch (err) {
      console.error('Erro ao carregar estoque:', err)
    } finally {
      setLoading(false)
    }
  }, [search, categoria, baixoEstoque, page])

  useEffect(() => {
    loadEstoque()
  }, [loadEstoque])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const startEdit = (item: EstoqueItem) => {
    setEditingId(item.id)
    setEditData({
      quantidade: item.quantidade,
      preco_farmacia: item.preco_farmacia?.toString() || ''
    })
  }

  const saveEdit = async (id: string) => {
    try {
      await farmaciaService.updateEstoque(id, {
        quantidade: editData.quantidade,
        preco_farmacia: editData.preco_farmacia ? Number(editData.preco_farmacia) : null
      })
      setEditingId(null)
      loadEstoque()
    } catch (err) {
      console.error('Erro ao atualizar estoque:', err)
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este produto do estoque?')) return
    try {
      await farmaciaService.deleteEstoque(id)
      loadEstoque()
    } catch (err) {
      console.error('Erro ao remover item:', err)
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Estoque</h1>
          <p className="text-gray-600">{total} produto(s) no estoque</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Adicionar Produto
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou princípio ativo..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoria}
            onChange={(e) => { setCategoria(e.target.value); setPage(1) }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todas as categorias</option>
            <option value="analgesico">Analgésico</option>
            <option value="antibiotico">Antibiótico</option>
            <option value="anti-inflamatorio">Anti-inflamatório</option>
            <option value="antialergico">Antialérgico</option>
            <option value="cardiovascular">Cardiovascular</option>
            <option value="vitaminas">Vitaminas</option>
            <option value="dermatologico">Dermatológico</option>
            <option value="outro">Outro</option>
          </select>
          <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={baixoEstoque}
              onChange={(e) => { setBaixoEstoque(e.target.checked); setPage(1) }}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="text-sm whitespace-nowrap">Estoque baixo</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum produto encontrado</p>
            <p className="text-gray-400 text-sm mt-1">Ajuste os filtros ou adicione novos produtos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Preço Ref.</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Preço Farmácia</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Receita</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                          <Pill className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.nome}</p>
                          <p className="text-xs text-gray-500">
                            {item.dosagem} {item.forma_farmaceutica && `• ${item.forma_farmaceutica}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{item.categoria || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          min="0"
                          value={editData.quantidade}
                          onChange={(e) => setEditData(prev => ({ ...prev, quantidade: Number(e.target.value) }))}
                          className="w-20 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-primary-500"
                        />
                      ) : (
                        <span className={`font-medium ${
                          item.quantidade === 0 ? 'text-red-600' :
                          item.quantidade <= 10 ? 'text-yellow-600' :
                          'text-gray-900'
                        }`}>
                          {item.quantidade}
                          {item.quantidade <= 10 && (
                            <AlertTriangle className="w-3 h-3 inline ml-1" />
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      {Number(item.preco_referencia).toLocaleString('pt-AO')} Kz
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editData.preco_farmacia}
                          onChange={(e) => setEditData(prev => ({ ...prev, preco_farmacia: e.target.value }))}
                          placeholder="Preço ref."
                          className="w-28 px-2 py-1 text-right border rounded focus:ring-2 focus:ring-primary-500"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900">
                          {item.preco_farmacia
                            ? `${Number(item.preco_farmacia).toLocaleString('pt-AO')} Kz`
                            : <span className="text-gray-400">—</span>
                          }
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.requer_receita ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Sim</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Não</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingId === item.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => saveEdit(item.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Mostrando {(page - 1) * LIMIT + 1}-{Math.min(page * LIMIT, total)} de {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => { setShowAddModal(false); loadEstoque() }}
        />
      )}
    </div>
  )
}

// ============================================
// Add Product Modal
// ============================================

function AddProductModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [search, setSearch] = useState('')
  const [catalogo, setCatalogo] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [quantidade, setQuantidade] = useState(10)
  const [precoFarmacia, setPrecoFarmacia] = useState('')

  useEffect(() => {
    if (search.length >= 2) {
      const timer = setTimeout(async () => {
        setLoading(true)
        try {
          const result = await farmaciaService.getCatalogo({ search, limit: 20 })
          setCatalogo(result as any[])
        } catch (err) {
          console.error('Erro ao buscar catálogo:', err)
        } finally {
          setLoading(false)
        }
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [search])

  const addProduct = async (medicamentoId: string) => {
    try {
      setAdding(medicamentoId)
      await farmaciaService.addEstoque({
        medicamento_id: medicamentoId,
        quantidade,
        preco_farmacia: precoFarmacia ? Number(precoFarmacia) : undefined
      })
      onAdded()
    } catch (err) {
      console.error('Erro ao adicionar:', err)
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">Adicionar Produto ao Estoque</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar medicamento no catálogo..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm text-gray-600 mb-1 block">Quantidade inicial</label>
              <input
                type="number"
                min="0"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-gray-600 mb-1 block">Preço da farmácia (Kz)</label>
              <input
                type="number"
                step="0.01"
                value={precoFarmacia}
                onChange={(e) => setPrecoFarmacia(e.target.value)}
                placeholder="Preço referência"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
            </div>
          ) : catalogo.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              {search.length < 2 ? 'Digite pelo menos 2 caracteres para buscar' : 'Nenhum medicamento encontrado'}
            </p>
          ) : (
            <div className="space-y-2">
              {catalogo.map((med: any) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Pill className="w-5 h-5 text-primary-500" />
                    <div>
                      <p className="font-medium text-gray-900">{med.nome}</p>
                      <p className="text-xs text-gray-500">
                        {med.dosagem} • {med.preco?.toLocaleString('pt-AO')} Kz
                        {med.estoque_farmacia !== null && (
                          <span className="text-emerald-600 ml-2">({med.estoque_farmacia} em estoque)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => addProduct(med.id)}
                    disabled={adding === med.id}
                    className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    {adding === med.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Adicionar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
