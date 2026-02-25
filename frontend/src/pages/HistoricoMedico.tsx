import { useState } from 'react'
import { FileText, Calendar, User, Pill, Activity, Heart, Download, Eye, Plus, Search } from 'lucide-react'

interface Registro {
  id: string
  tipo: 'consulta' | 'exame' | 'receita' | 'vacina'
  titulo: string
  profissional: string
  data: string
  descricao: string
  anexos?: number
}

export default function HistoricoMedico() {
  const [activeTab, setActiveTab] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')

  const tabs = [
    { id: 'todos', nome: 'Todos', icon: FileText },
    { id: 'consultas', nome: 'Consultas', icon: User },
    { id: 'exames', nome: 'Exames', icon: Activity },
    { id: 'receitas', nome: 'Receitas', icon: Pill },
    { id: 'vacinas', nome: 'Vacinas', icon: Heart },
  ]

  // Mock data
  const registros: Registro[] = [
    {
      id: '1',
      tipo: 'consulta',
      titulo: 'Consulta de Rotina - Cardiologia',
      profissional: 'Dr. João Silva',
      data: '2025-12-15',
      descricao: 'Check-up cardiovascular completo. Paciente apresenta pressão arterial normal.',
      anexos: 2
    },
    {
      id: '2',
      tipo: 'exame',
      titulo: 'Hemograma Completo',
      profissional: 'Lab. Central',
      data: '2025-12-10',
      descricao: 'Resultados dentro dos parâmetros normais.',
      anexos: 1
    },
    {
      id: '3',
      tipo: 'receita',
      titulo: 'Receita Médica - Antibiótico',
      profissional: 'Dra. Maria Santos',
      data: '2025-12-05',
      descricao: 'Amoxicilina 500mg - Tomar 1 comprimido a cada 8 horas por 7 dias',
      anexos: 1
    },
    {
      id: '4',
      tipo: 'vacina',
      titulo: 'Vacina contra Gripe',
      profissional: 'Enf. Ana Costa',
      data: '2025-11-20',
      descricao: 'Vacinação anual contra influenza',
      anexos: 0
    }
  ]

  const getIconByType = (tipo: string) => {
    switch (tipo) {
      case 'consulta':
        return User
      case 'exame':
        return Activity
      case 'receita':
        return Pill
      case 'vacina':
        return Heart
      default:
        return FileText
    }
  }

  const getColorByType = (tipo: string) => {
    switch (tipo) {
      case 'consulta':
        return 'blue'
      case 'exame':
        return 'green'
      case 'receita':
        return 'purple'
      case 'vacina':
        return 'pink'
      default:
        return 'gray'
    }
  }

  const getColorClasses = (color: string) => {
    const colors: any = {
      blue: {
        bg: 'bg-primary-50',
        text: 'text-primary-600',
        border: 'border-primary-200'
      },
      green: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-200'
      },
      purple: {
        bg: 'bg-accent-50',
        text: 'text-accent-600',
        border: 'border-accent-200'
      },
      pink: {
        bg: 'bg-pink-50',
        text: 'text-pink-600',
        border: 'border-pink-200'
      },
      gray: {
        bg: 'bg-gray-50',
        text: 'text-gray-600',
        border: 'border-gray-200'
      }
    }
    return colors[color]
  }

  const filteredRegistros = registros.filter(reg => {
    const matchesSearch = reg.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.profissional.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === 'todos' || reg.tipo === activeTab.slice(0, -1)
    return matchesSearch && matchesTab
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Histórico Médico
            </h1>
            <button className="px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Adicionar Registro</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: User, label: 'Consultas', count: 12, color: 'blue' },
            { icon: Activity, label: 'Exames', count: 8, color: 'green' },
            { icon: Pill, label: 'Receitas', count: 15, color: 'purple' },
            { icon: Heart, label: 'Vacinas', count: 5, color: 'pink' },
          ].map((stat) => {
            const Icon = stat.icon
            const colors = getColorClasses(stat.color)
            return (
              <div
                key={stat.label}
                className={`bg-white rounded-2xl p-6 shadow-lg border ${colors.border} transform hover:scale-105 transition`}
              >
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <div className={`text-3xl font-bold ${colors.text} mb-1`}>
                  {stat.count}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            )
          })}
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar no histórico..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.nome}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {filteredRegistros.map((registro, index) => {
            const Icon = getIconByType(registro.tipo)
            const color = getColorByType(registro.tipo)
            const colors = getColorClasses(color)

            return (
              <div
                key={registro.id}
                className="relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition"
              >
                {/* Timeline Line */}
                {index !== filteredRegistros.length - 1 && (
                  <div className="absolute left-8 top-20 w-0.5 h-full bg-gray-200 -z-10"></div>
                )}

                <div className="flex items-start space-x-6 p-6">
                  {/* Icon */}
                  <div className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-8 h-8 ${colors.text}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {registro.titulo}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{registro.profissional}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(registro.data).toLocaleDateString('pt-PT')}</span>
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-xs font-medium capitalize`}>
                        {registro.tipo}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-4">
                      {registro.descricao}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center space-x-3">
                      <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:shadow-lg transition text-sm">
                        <Eye className="w-4 h-4" />
                        <span>Ver Detalhes</span>
                      </button>
                      {registro.anexos && registro.anexos > 0 && (
                        <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm">
                          <Download className="w-4 h-4" />
                          <span>{registro.anexos} {registro.anexos === 1 ? 'Anexo' : 'Anexos'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredRegistros.length === 0 && (
          <div className="text-center py-20">
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum registro encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar sua busca ou filtros
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
