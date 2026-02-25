import { useEffect, useState } from 'react'
import {
  PlusCircle, Edit, Trash2, Truck,
  Loader2, X, AlertCircle, RefreshCw
} from 'lucide-react'
import { transporteService, type Veiculo } from '@/services/transporteService'

const TIPOS_VEICULO = ['moto', 'carro', 'van', 'caminhão'] as const

export default function GerirVeiculos() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add / Edit modal
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<Veiculo | null>(null)
  const [form, setForm] = useState({ placa: '', modelo: '', tipo: '', capacidade_kg: '' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Veiculo | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadVeiculos()
  }, [])

  const loadVeiculos = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await transporteService.getVeiculos()
      setVeiculos(data)
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar veículos')
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setModalMode('add')
    setEditTarget(null)
    setForm({ placa: '', modelo: '', tipo: '', capacidade_kg: '' })
    setFormError(null)
  }

  const openEditModal = (v: Veiculo) => {
    setModalMode('edit')
    setEditTarget(v)
    setForm({
      placa: v.placa,
      modelo: v.modelo,
      tipo: v.tipo || '',
      capacidade_kg: v.capacidade_kg ? String(v.capacidade_kg) : '',
    })
    setFormError(null)
  }

  const closeModal = () => {
    setModalMode(null)
    setEditTarget(null)
  }

  const handleSubmit = async () => {
    if (!form.placa.trim() || !form.modelo.trim()) {
      setFormError('Placa e modelo são obrigatórios')
      return
    }
    try {
      setSubmitting(true)
      setFormError(null)

      const payload = {
        placa: form.placa.trim(),
        modelo: form.modelo.trim(),
        tipo: form.tipo || undefined,
        capacidade_kg: form.capacidade_kg ? Number(form.capacidade_kg) : undefined,
      }

      if (modalMode === 'add') {
        await transporteService.addVeiculo(payload)
      } else if (modalMode === 'edit' && editTarget) {
        await transporteService.updateVeiculo(editTarget.id, payload)
      }
      closeModal()
      loadVeiculos()
    } catch (err: any) {
      setFormError(err?.message || 'Erro ao salvar veículo')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await transporteService.deleteVeiculo(deleteTarget.id)
      setDeleteTarget(null)
      loadVeiculos()
    } catch (err: any) {
      alert(err?.message || 'Erro ao remover veículo')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Veículos</h1>
          <p className="text-gray-600">Gerir a frota de veículos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadVeiculos}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="Atualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
          >
            <PlusCircle className="w-4 h-4" />
            Adicionar Veículo
          </button>
        </div>
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
      ) : veiculos.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum veículo registado</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Placa</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Modelo</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Tipo</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Capacidade (kg)</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {veiculos.map(v => (
                  <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-5 py-3 font-medium text-gray-900 uppercase tracking-wide">{v.placa}</td>
                    <td className="px-5 py-3 text-gray-700">{v.modelo}</td>
                    <td className="px-5 py-3 text-gray-600 capitalize">{v.tipo || '—'}</td>
                    <td className="px-5 py-3 text-center text-gray-600">
                      {v.capacidade_kg ? `${v.capacidade_kg} kg` : '—'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        v.is_ativo
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {v.is_ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(v)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                          title="Editar veículo"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(v)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Remover veículo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-5">
              {modalMode === 'add' ? 'Adicionar Veículo' : 'Editar Veículo'}
            </h2>

            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.placa}
                  onChange={e => setForm(f => ({ ...f, placa: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="Ex: LD-00-00-AA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modelo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.modelo}
                  onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="Ex: Toyota Hilux"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                >
                  <option value="">Selecionar tipo…</option>
                  {TIPOS_VEICULO.map(t => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidade (kg)
                </label>
                <input
                  type="number"
                  value={form.capacidade_kg}
                  onChange={e => setForm(f => ({ ...f, capacidade_kg: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="Ex: 500"
                  min={0}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {modalMode === 'add' ? 'Adicionar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Confirmar Remoção</h2>
            <p className="text-sm text-gray-600 mb-6">
              Tem certeza que deseja remover o veículo <strong>{deleteTarget.placa} — {deleteTarget.modelo}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
