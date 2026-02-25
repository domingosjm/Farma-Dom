import { useEffect, useState, useCallback } from 'react'
import {
  UserPlus, UserMinus, Search, RefreshCw,
  Stethoscope, Star, Loader2, X, AlertTriangle
} from 'lucide-react'
import { hospitalService, type MedicoHospital } from '@/services/hospitalService'

export default function GerirMedicos() {
  const [medicos, setMedicos] = useState<MedicoHospital[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showVincularModal, setShowVincularModal] = useState(false)
  const [medicoIdInput, setMedicoIdInput] = useState('')
  const [vinculando, setVinculando] = useState(false)
  const [vinculoError, setVinculoError] = useState<string | null>(null)
  const [desvinculando, setDesvinculando] = useState<string | null>(null)
  const [confirmDesvincular, setConfirmDesvincular] = useState<string | null>(null)

  const loadMedicos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await hospitalService.getMedicos()
      setMedicos(data)
    } catch (err) {
      console.error('Erro ao carregar médicos:', err)
      setError('Não foi possível carregar a lista de médicos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMedicos()
  }, [loadMedicos])

  const handleVincular = async () => {
    if (!medicoIdInput.trim()) return
    try {
      setVinculando(true)
      setVinculoError(null)
      await hospitalService.vincularMedico(medicoIdInput.trim())
      setShowVincularModal(false)
      setMedicoIdInput('')
      loadMedicos()
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Erro ao vincular médico.'
      setVinculoError(msg)
    } finally {
      setVinculando(false)
    }
  }

  const handleDesvincular = async (id: string) => {
    try {
      setDesvinculando(id)
      await hospitalService.desvincularMedico(id)
      setConfirmDesvincular(null)
      loadMedicos()
    } catch (err) {
      console.error('Erro ao desvincular médico:', err)
    } finally {
      setDesvinculando(null)
    }
  }

  const filteredMedicos = medicos.filter(m => {
    const q = search.toLowerCase()
    return (
      m.nome_completo.toLowerCase().includes(q) ||
      (m.especialidade || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q)
    )
  })

  // Error state
  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-gray-600 text-center">{error}</p>
        <button
          onClick={loadMedicos}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerir Médicos</h1>
          <p className="text-gray-600">{medicos.length} médico(s) vinculado(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadMedicos}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="Atualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setShowVincularModal(true); setVinculoError(null); setMedicoIdInput('') }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Vincular Médico
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Pesquisar por nome, especialidade ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      ) : filteredMedicos.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {search ? 'Nenhum médico encontrado para esta pesquisa.' : 'Nenhum médico vinculado.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Médico</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Especialidade</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Total Consultas</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Agendadas</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredMedicos.map(medico => (
                  <tr key={medico.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                          <Stethoscope className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{medico.nome_completo}</p>
                          <p className="text-xs text-gray-500">{medico.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {medico.especialidade || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-center font-medium">
                      {medico.total_consultas}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-center font-medium">
                      {medico.consultas_agendadas}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        medico.is_disponivel
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Star className="w-3 h-3" />
                        {medico.is_disponivel ? 'Disponível' : 'Indisponível'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {confirmDesvincular === medico.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-red-600 mr-1">Confirmar?</span>
                          <button
                            onClick={() => handleDesvincular(medico.id)}
                            disabled={desvinculando === medico.id}
                            className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                          >
                            {desvinculando === medico.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : 'Sim'}
                          </button>
                          <button
                            onClick={() => setConfirmDesvincular(null)}
                            className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDesvincular(medico.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          Desvincular
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vincular Modal */}
      {showVincularModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Vincular Médico</h2>
              <button
                onClick={() => setShowVincularModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID do Médico (UUID)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 550e8400-e29b-41d4-a716-446655440000"
                  value={medicoIdInput}
                  onChange={e => setMedicoIdInput(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>
              {vinculoError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {vinculoError}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setShowVincularModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleVincular}
                disabled={!medicoIdInput.trim() || vinculando}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {vinculando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Vincular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
