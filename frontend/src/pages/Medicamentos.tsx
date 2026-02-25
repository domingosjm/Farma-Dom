import { useState, useEffect } from 'react'
import { Search, ShoppingCart, Pill, Plus, Minus, Check, X, Loader2 } from 'lucide-react'
import { medicamentosService } from '@/services/medicamentosService'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import BuscaFarmaciaAnimation from '@/components/BuscaFarmaciaAnimation'

interface Medicamento {
  id: string
  nome: string
  principio_ativo?: string
  fabricante?: string
  preco: number
  descricao?: string
  estoque: number
  requer_receita: boolean
  categoria: string
  imagem_url?: string
}

export default function Medicamentos() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('todos')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutData, setCheckoutData] = useState({
    metodo_pagamento: 'dinheiro',
    endereco: '',
    observacoes: ''
  })
  const [processingOrder, setProcessingOrder] = useState(false)
  const [showBuscaFarmacia, setShowBuscaFarmacia] = useState(false)
  const [farmaciaEscolhida, setFarmaciaEscolhida] = useState<{ nome: string; distancia: string; tempo: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [medsData, catsData] = await Promise.all([
        medicamentosService.list(),
        medicamentosService.getCategories()
      ])
      setMedicamentos(medsData)
      setCategorias(['todos', ...catsData])
    } catch (error) {
      console.error('Erro ao carregar medicamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMedicamentos = medicamentos.filter(med => {
    const matchesSearch = med.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (med.principio_ativo?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'todos' || med.categoria === selectedCategory
    return matchesSearch && matchesCategory && med.estoque > 0
  })

  const updateCart = (id: string, delta: number) => {
    setCart(prev => {
      const newQty = (prev[id] || 0) + delta
      if (newQty <= 0) {
        const { [id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: newQty }
    })
  }

  const getTotalItems = () => Object.values(cart).reduce((sum, qty) => sum + qty, 0)
  
  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [id, qty]) => {
      const med = medicamentos.find(m => m.id === id)
      return total + (med ? med.preco * qty : 0)
    }, 0)
  }

  const handleFinalizarCompra = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (getTotalItems() === 0) {
      alert('Carrinho vazio!')
      return
    }

    setShowCheckout(true)
  }

  const handleConfirmarPedido = async () => {
    if (!user || !checkoutData.endereco || !checkoutData.metodo_pagamento) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    // Fechar modal de checkout e mostrar animação de busca
    setShowCheckout(false)
    setShowBuscaFarmacia(true)
  }

  const handleFarmaciaSelected = (farmacia: { id: number; nome: string; distancia: string; tempo: string }) => {
    setFarmaciaEscolhida(farmacia)
  }

  const handleBuscaComplete = async () => {
    if (!user) return
    
    try {
      setShowBuscaFarmacia(false)
      setProcessingOrder(true)

      const itens = Object.entries(cart).map(([id, qty]) => {
        const med = medicamentos.find(m => m.id === id)!
        return {
          medicamento_id: id,
          quantidade: qty,
          preco_unitario: med.preco
        }
      })

      const subtotal = getCartTotal()
      const taxa_entrega = subtotal > 50 ? 0 : 5
      const desconto = 0
      const total = subtotal + taxa_entrega - desconto

      await medicamentosService.criarPedido(user.id, {
        itens,
        subtotal,
        taxa_entrega,
        desconto,
        total,
        metodo_pagamento: checkoutData.metodo_pagamento,
        endereco_entrega: checkoutData.endereco,
        observacoes: checkoutData.observacoes
      })

      setCart({})
      setCheckoutData({ metodo_pagamento: 'dinheiro', endereco: '', observacoes: '' })
      
      // Mostrar mensagem de sucesso com informações da farmácia
      const farmaciaInfo = farmaciaEscolhida ? ` Será entregue por ${farmaciaEscolhida.nome} em aproximadamente ${farmaciaEscolhida.tempo}.` : ''
      alert(`✅ Pedido realizado com sucesso!${farmaciaInfo} Você será redirecionado para acompanhar o status.`)
      
      setFarmaciaEscolhida(null)
      
      // Redirecionar para página de pedidos
      setTimeout(() => {
        navigate('/pedidos')
      }, 1500)
    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      alert('Erro ao processar pedido. Tente novamente.')
    } finally {
      setProcessingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando medicamentos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Medicamentos
            </h1>
            <button 
              onClick={handleFinalizarCompra}
              className="relative p-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-full hover:shadow-lg transition"
            >
              <ShoppingCart className="w-6 h-6" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar medicamentos..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categorias.map((categoria) => (
              <button
                key={categoria}
                onClick={() => setSelectedCategory(categoria)}
                className={`px-6 py-3 rounded-full transition-all whitespace-nowrap capitalize ${
                  selectedCategory === categoria
                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{categoria}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedicamentos.map((medicamento) => (
            <div
              key={medicamento.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              {/* Image */}
              <div className="h-48 bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center relative">
                <Pill className="w-20 h-20 text-primary-600 opacity-50" />
                {medicamento.requer_receita && (
                  <span className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                    Receita
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    {medicamento.nome}
                  </h3>
                  <p className="text-sm text-gray-600">{medicamento.principio_ativo}</p>
                  <p className="text-xs text-gray-500 mt-1">{medicamento.fabricante}</p>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">
                  {medicamento.descricao}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="capitalize">{medicamento.categoria}</span>
                  <span className="text-emerald-600 font-medium">
                    {medicamento.estoque} em estoque
                  </span>
                </div>

                {/* Price and Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-2xl font-bold text-primary-600">
                      {medicamento.preco.toLocaleString('pt-AO', { 
                        style: 'currency', 
                        currency: 'AOA' 
                      })}
                    </span>
                  </div>

                  {cart[medicamento.id] ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateCart(medicamento.id, -1)}
                        className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-lg w-8 text-center">
                        {cart[medicamento.id]}
                      </span>
                      <button
                        onClick={() => updateCart(medicamento.id, 1)}
                        className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-200 transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => updateCart(medicamento.id, 1)}
                      className="px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Adicionar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredMedicamentos.length === 0 && (
          <div className="text-center py-20">
            <Pill className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum medicamento encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar sua busca ou filtros
            </p>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Finalizar Pedido</h2>
                <button 
                  onClick={() => setShowCheckout(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Resumo do Carrinho */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Itens do Pedido</h3>
                <div className="space-y-2">
                  {Object.entries(cart).map(([id, qty]) => {
                    const med = medicamentos.find(m => m.id === id)
                    if (!med) return null
                    return (
                      <div key={id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{med.nome}</p>
                          <p className="text-sm text-gray-600">Quantidade: {qty}</p>
                        </div>
                        <p className="font-bold text-primary-600">
                          {(med.preco * qty).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Formulário */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço de Entrega *
                  </label>
                  <textarea
                    value={checkoutData.endereco}
                    onChange={(e) => setCheckoutData({ ...checkoutData, endereco: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Rua, número, bairro, cidade..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pagamento *
                  </label>
                  <select
                    value={checkoutData.metodo_pagamento}
                    onChange={(e) => setCheckoutData({ ...checkoutData, metodo_pagamento: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="transferencia">Transferência Bancária</option>
                    <option value="multicaixa">Multicaixa Express</option>
                    <option value="cartao">Cartão de Crédito</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={checkoutData.observacoes}
                    onChange={(e) => setCheckoutData({ ...checkoutData, observacoes: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Alguma observação sobre o pedido..."
                  />
                </div>
              </div>

              {/* Totais */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">
                    {getCartTotal().toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Taxa de Entrega:</span>
                  <span className="font-semibold">
                    {(getCartTotal() > 50 ? 0 : 5).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-primary-600">
                    {(getCartTotal() + (getCartTotal() > 50 ? 0 : 5)).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </span>
                </div>
                {getCartTotal() <= 50 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Frete grátis para pedidos acima de 50,00 Kz
                  </p>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  disabled={processingOrder}
                >
                  Voltar
                </button>
                <button
                  onClick={handleConfirmarPedido}
                  disabled={processingOrder || !checkoutData.endereco}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:shadow-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {processingOrder ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Confirmar Pedido</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animação de Busca de Farmácia */}
      <BuscaFarmaciaAnimation
        isOpen={showBuscaFarmacia}
        onComplete={handleBuscaComplete}
        onFarmaciaSelected={handleFarmaciaSelected}
      />

      {/* Modal de Processamento Final */}
      {processingOrder && farmaciaEscolhida && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center animate-scale-in shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Finalizando Pedido</h3>
            <p className="text-gray-600 mb-4">
              Enviando seu pedido para <span className="font-semibold text-primary-600">{farmaciaEscolhida.nome}</span>
            </p>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full animate-pulse w-full" />
            </div>
            <p className="text-xs text-gray-500 mt-3">Por favor, aguarde...</p>
          </div>
        </div>
      )}
    </div>
  )
}
