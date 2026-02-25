import { useEffect, useState, useCallback } from 'react'
import {
  Users, Plus, Mail, Phone, Trash2, Loader2,
  UserCheck, UserX, X, AlertCircle, Send, Shield
} from 'lucide-react'
import { farmaciaService, type Funcionario } from '@/services/farmaciaService'

export default function FuncionariosFarmacia() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadFuncionarios = useCallback(async () => {
    try {
      setLoading(true)
      const data = await farmaciaService.getFuncionarios()
      setFuncionarios(data)
    } catch (err) {
      console.error('Erro ao carregar funcionários:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFuncionarios()
  }, [loadFuncionarios])

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este funcionário? Ele perderá acesso ao sistema.')) return
    
    try {
      setDeletingId(id)
      await farmaciaService.deleteFuncionario(id)
      loadFuncionarios()
    } catch (err) {
      console.error('Erro ao remover funcionário:', err)
      alert('Erro ao remover funcionário. Tente novamente.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funcionários</h1>
          <p className="text-gray-600">Gerir equipa da farmácia</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Convidar Funcionário
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-primary-800 font-medium">Sobre Funcionários</p>
          <p className="text-primary-700 text-sm mt-1">
            Funcionários podem visualizar pedidos, gerir estoque e aceitar vendas. 
            Apenas o administrador pode adicionar ou remover funcionários.
          </p>
        </div>
      </div>

      {/* Employees List */}
      {funcionarios.length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum funcionário</h3>
          <p className="text-gray-500 mb-6">
            Convide membros da sua equipa para ajudar na gestão da farmácia
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-medium"
          >
            <Plus className="w-5 h-5" />
            Convidar Primeiro Funcionário
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {funcionarios.map((f) => (
            <FuncionarioCard
              key={f.id}
              funcionario={f}
              onDelete={handleDelete}
              isDeleting={deletingId === f.id}
            />
          ))}
        </div>
      )}

      {/* Stats */}
      {funcionarios.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="stat-icon bg-primary-50">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{funcionarios.length}</p>
            <p className="text-sm text-gray-500 mt-1">Total de Funcionários</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="stat-icon bg-green-50">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {funcionarios.filter(f => f.status_conta === 'ativo').length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Ativos</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="stat-icon bg-yellow-50">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {funcionarios.filter(f => f.status_conta === 'pendente').length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Convites Pendentes</p>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddFuncionarioModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => { setShowAddModal(false); loadFuncionarios() }}
        />
      )}
    </div>
  )
}

// ============================================
// Funcionario Card Component
// ============================================

function FuncionarioCard({ funcionario, onDelete, isDeleting }: {
  funcionario: Funcionario
  onDelete: (id: string) => void
  isDeleting: boolean
}) {
  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    ativo: { label: 'Ativo', color: 'text-green-700', bg: 'bg-green-100', icon: <UserCheck className="w-3.5 h-3.5" /> },
    pendente: { label: 'Pendente', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: <AlertCircle className="w-3.5 h-3.5" /> },
    inativo: { label: 'Inativo', color: 'text-red-700', bg: 'bg-red-100', icon: <UserX className="w-3.5 h-3.5" /> },
  }

  const status = statusConfig[funcionario.status_conta] || statusConfig.pendente

  return (
    <div className="card-elevated p-5 hover:shadow-farma transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {funcionario.avatar_url ? (
            <img
              src={funcionario.avatar_url}
              alt={funcionario.nome_completo}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold">
              {funcionario.nome_completo.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{funcionario.nome_completo}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
              {status.icon}
              {status.label}
            </span>
          </div>
        </div>
        <button
          onClick={() => onDelete(funcionario.id)}
          disabled={isDeleting}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
          title="Remover funcionário"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="truncate">{funcionario.email}</span>
        </div>
        {funcionario.telefone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{funcionario.telefone}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Desde {new Date(funcionario.created_at).toLocaleDateString('pt-PT')}
        </p>
      </div>
    </div>
  )
}

// ============================================
// Add Funcionario Modal
// ============================================

function AddFuncionarioModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    telefone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.nome_completo.trim() || !formData.email.trim()) {
      setError('Nome e email são obrigatórios')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Email inválido')
      return
    }

    try {
      setLoading(true)
      await farmaciaService.addFuncionario({
        nome_completo: formData.nome_completo.trim(),
        email: formData.email.trim(),
        telefone: formData.telefone.trim() || undefined
      })
      onAdded()
    } catch (err: any) {
      console.error('Erro ao adicionar funcionário:', err)
      setError(err.response?.data?.error || 'Erro ao enviar convite. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">Convidar Funcionário</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.nome_completo}
              onChange={(e) => setFormData(prev => ({ ...prev, nome_completo: e.target.value }))}
              placeholder="Nome do funcionário"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemplo.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
              placeholder="+244 900 000 000"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-1">O que acontece depois?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>O funcionário receberá um email com o convite</li>
              <li>Ao aceitar, terá acesso à gestão da farmácia</li>
              <li>Poderá ver pedidos e gerir estoque</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Enviar Convite
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
