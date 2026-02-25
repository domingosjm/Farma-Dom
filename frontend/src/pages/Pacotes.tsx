import { useEffect, useState } from 'react'
import { Check, Star, Zap, Shield, Heart, CreditCard, Smartphone, Building2, X, Loader2, CheckCircle2, XCircle, Calendar, Package } from 'lucide-react'
import { pacotesService, PacoteSaude, AssinarPacoteData, AssinaturaDetalhada } from '@/services/pacotesService'

type MetodoPagamento = 'cartao' | 'multicaixa' | 'transferencia'

export default function Pacotes() {
  const [pacotes, setPacotes] = useState<PacoteSaude[]>([])
  const [assinaturaAtiva, setAssinaturaAtiva] = useState<AssinaturaDetalhada | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCheckout, setShowCheckout] = useState(false)
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
      const [pacotesData, assinaturaData] = await Promise.all([
        pacotesService.getPacotes(),
        pacotesService.getAssinaturaAtiva()
      ])
      setPacotes(pacotesData.filter(p => p.is_ativo))
      setAssinaturaAtiva(assinaturaData)
    } catch (error: any) {
      console.error('Erro ao carregar pacotes:', error)
      setMensagem({ tipo: 'error', texto: 'Erro ao carregar pacotes' })
    } finally {
      setLoading(false)
    }
  }

  const handleAssinar = (pacote: PacoteSaude) => {
    if (assinaturaAtiva && assinaturaAtiva.status === 'ativa') {
      setMensagem({ tipo: 'error', texto: 'Você já possui uma assinatura ativa' })
      return
    }
    setSelectedPacote(pacote)
    setShowCheckout(true)
  }

  const handleProcessarPagamento = async () => {
    if (!selectedPacote) return

    try {
      setProcessando(true)
      setMensagem(null)

      const dados: AssinarPacoteData = {
        metodo_pagamento: metodoPagamento,
        dados_pagamento: {} // Aqui viriam os dados do cartão/multicaixa/etc
      }

      await pacotesService.assinarPacote(selectedPacote.id, dados)
      
      setMensagem({ tipo: 'success', texto: 'Assinatura realizada com sucesso!' })
      setShowCheckout(false)
      
      // Recarregar dados
      setTimeout(() => {
        carregarDados()
        setMensagem(null)
      }, 2000)
    } catch (error: any) {
      setMensagem({ 
        tipo: 'error', 
        texto: error.response?.data?.error || 'Erro ao processar pagamento' 
      })
    } finally {
      setProcessando(false)
    }
  }

  const getColorClasses = (tipo: string) => {
    const colors: any = {
      individual: {
        gradient: 'from-primary-600 to-primary-700',
        bg: 'bg-primary-50',
        text: 'text-primary-600',
        border: 'border-primary-600'
      },
      familiar: {
        gradient: 'from-emerald-600 to-teal-600',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-600'
      },
      premium: {
        gradient: 'from-accent-600 to-pink-600',
        bg: 'bg-accent-50',
        text: 'text-accent-600',
        border: 'border-accent-600'
      }
    }
    return colors[tipo] || colors.individual
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            Planos de Saúde
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

        {/* Assinatura Ativa */}
        {assinaturaAtiva && assinaturaAtiva.status === 'ativa' && (
          <div className="mb-8 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Plano Ativo</h3>
                  <p className="text-white/90">{assinaturaAtiva.pacote_nome}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 text-white/90">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    Válido até {assinaturaAtiva.data_fim ? new Date(assinaturaAtiva.data_fim).toLocaleDateString('pt-AO') : 'Indeterminado'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha o plano ideal para você
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tenha acesso a consultas médicas, medicamentos com desconto e muito mais
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {pacotes.map((pacote) => {
            const colors = getColorClasses(pacote.tipo)
            const isPopular = pacote.tipo === 'premium' || pacote.tipo === 'familiar'
            const beneficios = typeof pacote.beneficios === 'string' 
              ? JSON.parse(pacote.beneficios)
              : pacote.beneficios

            return (
              <div
                key={pacote.id}
                className={`relative bg-white rounded-3xl shadow-xl border-2 overflow-hidden transition-all transform hover:scale-105 ${
                  isPopular ? colors.border : 'border-gray-200'
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className={`absolute top-0 right-0 bg-gradient-to-r ${colors.gradient} text-white px-4 py-1 rounded-bl-2xl font-bold text-sm`}>
                    RECOMENDADO
                  </div>
                )}

                <div className="p-8">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center mb-6`}>
                    <Star className="w-8 h-8 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {pacote.nome}
                  </h3>
                  <p className="text-gray-600 mb-6">{pacote.descricao}</p>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline">
                      <span className={`text-4xl font-bold ${colors.text}`}>
                        {pacote.preco_mensal.toLocaleString('pt-AO', { 
                          style: 'currency', 
                          currency: 'AOA',
                          minimumFractionDigits: 0
                        })}
                      </span>
                      <span className="text-gray-600 ml-2">/mês</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Duração: {pacote.duracao_meses} {pacote.duracao_meses === 1 ? 'mês' : 'meses'}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {beneficios.map((beneficio: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className={`w-5 h-5 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Check className={`w-3 h-3 ${colors.text}`} />
                        </div>
                        <span className="text-gray-700">{beneficio}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button 
                    onClick={() => handleAssinar(pacote)}
                    disabled={assinaturaAtiva?.status === 'ativa'}
                    className={`w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r ${colors.gradient} hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {assinaturaAtiva?.status === 'ativa' ? 'Plano Ativo' : 'Assinar Agora'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Benefícios Inclusos em Todos os Planos
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Sem Carência</h4>
              <p className="text-sm text-gray-600">Use imediatamente após a contratação</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Cancelamento Fácil</h4>
              <p className="text-sm text-gray-600">Cancele quando quiser sem multa</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Atendimento Rápido</h4>
              <p className="text-sm text-gray-600">Consultas em até 24 horas</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Médicos Qualificados</h4>
              <p className="text-sm text-gray-600">Profissionais certificados e experientes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Checkout */}
      {showCheckout && selectedPacote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-2xl font-bold text-gray-900">Finalizar Assinatura</h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Resumo do Pacote */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Resumo da Assinatura</h3>
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duração:</span>
                    <span className="font-semibold text-gray-900">{selectedPacote.duracao_meses} meses</span>
                  </div>
                  <div className="pt-3 border-t border-gray-300 flex justify-between">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="font-bold text-2xl bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                      {(selectedPacote.preco_mensal * selectedPacote.duracao_meses).toLocaleString('pt-AO', { 
                        style: 'currency', 
                        currency: 'AOA',
                        minimumFractionDigits: 0
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Métodos de Pagamento */}
              <div className="mb-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Método de Pagamento</h3>
                <div className="grid gap-4">
                  {/* Cartão */}
                  <button
                    onClick={() => setMetodoPagamento('cartao')}
                    className={`p-4 rounded-xl border-2 flex items-center space-x-4 transition-all ${
                      metodoPagamento === 'cartao'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      metodoPagamento === 'cartao' ? 'bg-blue-600' : 'bg-gray-100'
                    }`}>
                      <CreditCard className={`w-6 h-6 ${
                        metodoPagamento === 'cartao' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900">Cartão de Crédito/Débito</div>
                      <div className="text-sm text-gray-600">Visa, Mastercard, etc.</div>
                    </div>
                  </button>

                  {/* Multicaixa */}
                  <button
                    onClick={() => setMetodoPagamento('multicaixa')}
                    className={`p-4 rounded-xl border-2 flex items-center space-x-4 transition-all ${
                      metodoPagamento === 'multicaixa'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      metodoPagamento === 'multicaixa' ? 'bg-blue-600' : 'bg-gray-100'
                    }`}>
                      <Smartphone className={`w-6 h-6 ${
                        metodoPagamento === 'multicaixa' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900">Multicaixa Express</div>
                      <div className="text-sm text-gray-600">Pagamento instantâneo</div>
                    </div>
                  </button>

                  {/* Transferência */}
                  <button
                    onClick={() => setMetodoPagamento('transferencia')}
                    className={`p-4 rounded-xl border-2 flex items-center space-x-4 transition-all ${
                      metodoPagamento === 'transferencia'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      metodoPagamento === 'transferencia' ? 'bg-blue-600' : 'bg-gray-100'
                    }`}>
                      <Building2 className={`w-6 h-6 ${
                        metodoPagamento === 'transferencia' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900">Transferência Bancária</div>
                      <div className="text-sm text-gray-600">Processamento em 1-2 dias úteis</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowCheckout(false)}
                  disabled={processando}
                  className="flex-1 py-4 rounded-xl font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleProcessarPagamento}
                  disabled={processando}
                  className="flex-1 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary-600 to-accent-600 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {processando ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <span>Confirmar Pagamento</span>
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
