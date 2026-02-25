import { useState } from 'react'
import { User, Mail, Phone, MapPin, Calendar, Lock, Bell, CreditCard, FileText, LogOut, Camera, Edit2, Save } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export default function Perfil() {
  const { user, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('perfil')
  const [isEditing, setIsEditing] = useState(false)

  const tabs = [
    { id: 'perfil', nome: 'Meu Perfil', icon: User },
    { id: 'seguranca', nome: 'Segurança', icon: Lock },
    { id: 'notificacoes', nome: 'Notificações', icon: Bell },
    { id: 'pagamento', nome: 'Pagamento', icon: CreditCard },
    { id: 'documentos', nome: 'Documentos', icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            Meu Perfil
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.nome}</span>
                  </button>
                )
              })}
              <button
                onClick={logout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all mt-4"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sair</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'perfil' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Cover Image */}
                <div className="h-32 bg-gradient-to-r from-primary-600 to-accent-600"></div>
                
                {/* Profile Header */}
                <div className="px-8 pb-8">
                  <div className="flex items-end justify-between -mt-16 mb-6">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full bg-white p-2 shadow-xl">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                          <User className="w-16 h-16 text-primary-600" />
                        </div>
                      </div>
                      <button className="absolute bottom-2 right-2 w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition shadow-lg">
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-6 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2"
                    >
                      {isEditing ? (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Salvar</span>
                        </>
                      ) : (
                        <>
                          <Edit2 className="w-4 h-4" />
                          <span>Editar Perfil</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Profile Info */}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{user?.nome_completo || 'Usuário'}</h2>
                      <p className="text-gray-600">{user?.email || 'email@example.com'}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome Completo
                        </label>
                        <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                          <User className="w-5 h-5 text-gray-400" />
                          {isEditing ? (
                            <input
                              type="text"
                              defaultValue={user?.nome_completo}
                              className="flex-1 bg-transparent focus:outline-none"
                            />
                          ) : (
                            <span className="text-gray-900">{user?.nome_completo || 'Não informado'}</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-900">{user?.email || 'Não informado'}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telefone
                        </label>
                        <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                          <Phone className="w-5 h-5 text-gray-400" />
                          {isEditing ? (
                            <input
                              type="tel"
                              placeholder="+244 900 000 000"
                              className="flex-1 bg-transparent focus:outline-none"
                            />
                          ) : (
                            <span className="text-gray-900">Não informado</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data de Nascimento
                        </label>
                        <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          {isEditing ? (
                            <input
                              type="date"
                              className="flex-1 bg-transparent focus:outline-none"
                            />
                          ) : (
                            <span className="text-gray-900">Não informado</span>
                          )}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Endereço
                        </label>
                        <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          {isEditing ? (
                            <input
                              type="text"
                              placeholder="Rua, Número, Bairro, Cidade"
                              className="flex-1 bg-transparent focus:outline-none"
                            />
                          ) : (
                            <span className="text-gray-900">Não informado</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'seguranca' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Segurança</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Senha Atual
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button className="px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:shadow-lg transition">
                    Alterar Senha
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notificacoes' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Notificações</h2>
                <div className="space-y-4">
                  {['Consultas agendadas', 'Lembretes de medicação', 'Novidades e promoções', 'Atualizações do sistema'].map((item) => (
                    <div key={item} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">{item}</span>
                      <label className="relative inline-block w-12 h-6">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-primary-600 transition-colors"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'pagamento' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Métodos de Pagamento</h2>
                <p className="text-gray-600 text-center py-12">Nenhum método de pagamento cadastrado</p>
                <button className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:shadow-lg transition">
                  Adicionar Cartão
                </button>
              </div>
            )}

            {activeTab === 'documentos' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Meus Documentos</h2>
                <p className="text-gray-600 text-center py-12">Nenhum documento enviado</p>
                <button className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:shadow-lg transition">
                  Enviar Documento
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
