import { useEffect, useState } from 'react'
import { 
  Package, TrendingUp, Calendar, CreditCard, History, AlertCircle, 
  Check, X, Loader2, CheckCircle2, XCircle, Activity, DollarSign,
  Stethoscope, Pill,
  ChevronRight
} from 'lucide-react'
import { 
  pacotesService, 
  EstatisticasUso, 
  PagamentoHistorico, 
  PacoteSaude,
  AssinaturaDetalhada,
  UpgradeData
} from '@/services/pacotesService'

type Tab = 'visao-geral' | 'historico' | 'gerenciar'
type MetodoPagamento = 'cartao' | 'multicaixa' | 'transferencia'

export default function MinhaAssinatura() {
  const [activeTab, setActiveTab] = useState<Tab>('visao-geral')
  const [estatisticas, setEstatisticas] = useState<EstatisticasUso | null>(null)
  const [historico, setHistorico] = useState<PagamentoHistorico[]>([])
  const [pacotesDisponiveis, setPacotesDisponiveis] = useState<PacoteSaude[]>([])
  const [assinaturaAtual, setAssinaturaAtual] = useState<AssinaturaDetalhada | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedPacote, setSelectedPacote] = useState<PacoteSaude | null>(null)
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>('cartao')
  const [processando, setProcessando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const [stats, pagamentos, pacotes, assinatura] = await Promise.all([
        pacotesService.getEstatisticasUso(),
        pacotesService.getHistoricoPagamentos(),
        pacotesService.getPacotes(),
        pacotesService.getAssinaturaAtiva()
      ])
      
      setEstatisticas(stats)
      setHistorico(pagamentos)
      setPacotesDisponiveis(pacotes.filter(p => p.is_ativo))
      setAssinaturaAtual(assinatura)
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      setMensagem({ tipo: 'error', texto: 'Erro ao carregar informações' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async () => {
    if (!selectedPacote || !assinaturaAtual) return

    try {
      setProcessando(true)
      setMensagem(null)

      const data: UpgradeData = {
        novo_pacote_id: selectedPacote.id,
        metodo_pagamento: metodoPagamento
      }

      await pacotesService.upgradePlano(assinaturaAtual.id, data)
      
      setMensagem({ tipo: 'success', texto: 'Plano alterado com sucesso!' })
      setShowUpgradeModal(false)
      
      setTimeout(() => {
        carregarDados()
        setMensagem(null)
      }, 2000)
    } catch (error: any) {
      setMensagem({ 
        tipo: 'error', 
        texto: error.response?.data?.error || 'Erro ao alterar plano' 
      })
    } finally {
      setProcessando(false)
    }
  }

  const handleCancelar = async () => {
    if (!assinaturaAtual) return

    try {
      setProcessando(true)
      setMensagem(null)

      await pacotesService.cancelarAssinatura(assinaturaAtual.id)
      
      setMensagem({ tipo: 'success', texto: 'Assinatura cancelada com sucesso' })
      setShowCancelModal(false)
      
      setTimeout(() => {
        carregarDados()
        setMensagem(null)
      }, 2000)
    } catch (error: any) {
      setMensagem({ 
        tipo: 'error', 
        texto: error.response?.data?.error || 'Erro ao cancelar assinatura' 
      })
    } finally {
      setProcessando(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      ativa: 'bg-emerald-100 text-emerald-800',
      suspensa: 'bg-yellow-100 text-yellow-800',
      cancelada: 'bg-red-100 text-red-800',
      expirada: 'bg-gray-100 text-gray-800',
      aprovado: 'bg-emerald-100 text-emerald-800',
      pendente: 'bg-yellow-100 text-yellow-800',
      recusado: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getMetodoPagamentoNome = (metodo: string) => {
    const nomes: any = {
      cartao: 'Cartão',
      multicaixa: 'Multicaixa Express',
      transferencia: 'Transferência'
    }
    return nomes[metodo] || metodo
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!estatisticas?.has_subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50/30">
        <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Minha Assinatura
            </h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-3xl p-12 text-center shadow-xl">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Você ainda não possui uma assinatura
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Assine um plano para ter acesso a consultas, descontos e muito mais!
            </p>
            <a 
              href="/pacotes"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              <span>Ver Planos Disponíveis</span>
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            Minha Assinatura
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensagens */}
        {mensagem && (
          <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${
            mensagem.tipo === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
          }`}>
            {mensagem.tipo === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>{mensagem.texto}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl p-2 mb-6 flex space-x-2 shadow-md">
          <button
            onClick={() => setActiveTab('visao-geral')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'visao-geral'
                ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Visão Geral</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'historico'
                ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <History className="w-5 h-5" />
              <span>Histórico</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('gerenciar')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'gerenciar'
                ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Gerenciar</span>
            </div>
          </button>
        </div>

        {/* Tab: Visão Geral */}
        {activeTab === 'visao-geral' && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-3xl p-8 text-white shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Package className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{estatisticas.pacote_nome}</h2>
                    <p className="text-white/90">Plano Ativo</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl font-bold ${getStatusColor(estatisticas.status || 'ativa')} bg-white`}>
                  {estatisticas.status?.toUpperCase()}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center space-x-2 text-white/80 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Início</span>
                  </div>
                  <p className="text-xl font-bold">
                    {new Date(estatisticas.data_inicio || '').toLocaleDateString('pt-AO')}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center space-x-2 text-white/80 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Próxima Cobrança</span>
                  </div>
                  <p className="text-xl font-bold">
                    {new Date(estatisticas.data_fim || '').toLocaleDateString('pt-AO')}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Consultas */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Stethoscope className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Consultas</h3>
                      <p className="text-sm text-gray-600">Neste mês</p>
                    </div>
                  </div>
                </div>
                
                {estatisticas.consultas && (
                  <>
                    <div className="mb-4">
                      <div className="flex items-baseline space-x-2 mb-2">
                        <span className="text-4xl font-bold text-gray-900">
                          {estatisticas.consultas.usadas}
                        </span>
                        <span className="text-xl text-gray-600">
                          / {estatisticas.consultas.disponiveis}
                        </span>
                      </div>
                      {estatisticas.consultas.disponiveis !== 'Ilimitadas' && (
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-full h-3 transition-all"
                            style={{ width: `${Math.min(estatisticas.consultas.percentual, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {estatisticas.consultas.disponiveis === 'Ilimitadas'
                        ? 'Consultas ilimitadas disponíveis'
                        : `${estatisticas.consultas.disponiveis - estatisticas.consultas.usadas} consultas restantes`
                      }
                    </p>
                  </>
                )}
              </div>

              {/* Medicamentos */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Pill className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Medicamentos</h3>
                      <p className="text-sm text-gray-600">Economias neste mês</p>
                    </div>
                  </div>
                </div>
                
                {estatisticas.medicamentos && (
                  <>
                    <div className="mb-4">
                      <div className="flex items-baseline space-x-2 mb-2">
                        <span className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {estatisticas.medicamentos.economizado.toLocaleString('pt-AO', {
                            style: 'currency',
                            currency: 'AOA',
                            minimumFractionDigits: 0
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-green-600">
                        <DollarSign className="w-5 h-5" />
                        <span className="font-semibold">{estatisticas.medicamentos.desconto}% de desconto</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {estatisticas.medicamentos.pedidos} pedidos realizados
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Histórico */}
        {activeTab === 'historico' && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Histórico de Pagamentos</h2>
              <p className="text-gray-600">Todos os seus pagamentos registrados</p>
            </div>

            {historico.length === 0 ? (
              <div className="p-12 text-center">
                <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum pagamento registrado ainda</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Data</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Pacote</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Método</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Valor</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Referência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {historico.map((pagamento) => (
                      <tr key={pagamento.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(pagamento.data_pagamento).toLocaleDateString('pt-AO')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{pagamento.pacote_nome}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(pagamento.data_inicio).toLocaleDateString('pt-AO')} até{' '}
                            {new Date(pagamento.data_fim).toLocaleDateString('pt-AO')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {getMetodoPagamentoNome(pagamento.metodo_pagamento)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {pagamento.valor.toLocaleString('pt-AO', {
                            style: 'currency',
                            currency: 'AOA',
                            minimumFractionDigits: 0
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(pagamento.status)}`}>
                            {pagamento.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                          {pagamento.referencia_pagamento}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab: Gerenciar */}
        {activeTab === 'gerenciar' && (
          <div className="space-y-6">
            {/* Alterar Plano */}
            <div className="bg-white rounded-3xl p-8 shadow-xl">
              <div className="flex items-center space-x-3 mb-6">
                <TrendingUp className="w-6 h-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900">Alterar Plano</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Faça upgrade ou downgrade do seu plano atual
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                {pacotesDisponiveis.map((pacote) => {
                  const isAtual = pacote.id === assinaturaAtual?.pacote_id
                  const beneficios = typeof pacote.beneficios === 'string' 
                    ? JSON.parse(pacote.beneficios)
                    : pacote.beneficios

                  return (
                    <div
                      key={pacote.id}
                      className={`border-2 rounded-2xl p-6 transition-all ${
                        isAtual 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {isAtual && (
                        <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold inline-block mb-4">
                          PLANO ATUAL
                        </div>
                      )}
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{pacote.nome}</h3>
                      <p className="text-gray-600 text-sm mb-4">{pacote.descricao}</p>
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-gray-900">
                          {pacote.preco_mensal.toLocaleString('pt-AO', {
                            style: 'currency',
                            currency: 'AOA',
                            minimumFractionDigits: 0
                          })}
                        </span>
                        <span className="text-gray-600">/mês</span>
                      </div>
                      <ul className="space-y-2 mb-6">
                        {beneficios.slice(0, 3).map((beneficio: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{beneficio}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => {
                          setSelectedPacote(pacote)
                          setShowUpgradeModal(true)
                        }}
                        disabled={isAtual}
                        className={`w-full py-3 rounded-xl font-bold transition-all ${
                          isAtual
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-primary-600 to-accent-600 text-white hover:shadow-lg'
                        }`}
                      >
                        {isAtual ? 'Plano Atual' : 'Selecionar'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Cancelar Assinatura */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-red-200">
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h2 className="text-2xl font-bold text-gray-900">Cancelar Assinatura</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Ao cancelar, você perderá acesso a todos os benefícios do plano. Seus dados serão mantidos e você poderá reativar a qualquer momento.
              </p>
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
              >
                Cancelar Assinatura
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Upgrade */}
      {showUpgradeModal && selectedPacote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-2xl font-bold text-gray-900">Confirmar Alteração de Plano</h2>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Novo Plano</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plano:</span>
                    <span className="font-semibold text-gray-900">{selectedPacote.nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor Mensal:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedPacote.preco_mensal.toLocaleString('pt-AO', {
                        style: 'currency',
                        currency: 'AOA',
                        minimumFractionDigits: 0
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Método de Pagamento</h3>
                <div className="grid gap-4">
                  <button
                    onClick={() => setMetodoPagamento('cartao')}
                    className={`p-4 rounded-xl border-2 flex items-center space-x-4 transition-all ${
                      metodoPagamento === 'cartao'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="font-semibold">Cartão de Crédito/Débito</span>
                  </button>
                  <button
                    onClick={() => setMetodoPagamento('multicaixa')}
                    className={`p-4 rounded-xl border-2 flex items-center space-x-4 transition-all ${
                      metodoPagamento === 'multicaixa'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="font-semibold">Multicaixa Express</span>
                  </button>
                  <button
                    onClick={() => setMetodoPagamento('transferencia')}
                    className={`p-4 rounded-xl border-2 flex items-center space-x-4 transition-all ${
                      metodoPagamento === 'transferencia'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="font-semibold">Transferência Bancária</span>
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  disabled={processando}
                  className="flex-1 py-4 rounded-xl font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpgrade}
                  disabled={processando}
                  className="flex-1 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary-600 to-accent-600 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {processando ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <span>Confirmar Alteração</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancelar */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full">
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
                Cancelar Assinatura?
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Tem certeza que deseja cancelar sua assinatura? Você perderá acesso a todos os benefícios do plano.
              </p>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={processando}
                  className="flex-1 py-4 rounded-xl font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Não, Manter
                </button>
                <button
                  onClick={handleCancelar}
                  disabled={processando}
                  className="flex-1 py-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {processando ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Cancelando...</span>
                    </>
                  ) : (
                    <span>Sim, Cancelar</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
