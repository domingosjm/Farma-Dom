import { useEffect, useState, useCallback } from 'react'
import {
  BarChart3, TrendingUp, TrendingDown, Package, Calendar,
  Loader2, Download, RefreshCw, DollarSign, ShoppingCart,
  Pill, AlertCircle, CheckCircle, XCircle
} from 'lucide-react'
import { farmaciaService, type VendasReport, type ProdutoMaisVendido } from '@/services/farmaciaService'

type PeriodoType = 7 | 30 | 90

export default function RelatoriosFarmacia() {
  const [periodo, setPeriodo] = useState<PeriodoType>(30)
  const [vendas, setVendas] = useState<VendasReport[]>([])
  const [produtos, setProdutos] = useState<ProdutoMaisVendido[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [vendasData, produtosData] = await Promise.all([
        farmaciaService.getVendasReport(periodo),
        farmaciaService.getProdutosMaisVendidos(10)
      ])
      setVendas(vendasData)
      setProdutos(produtosData)
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err)
    } finally {
      setLoading(false)
    }
  }, [periodo])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Calculate totals
  const totais = vendas.reduce(
    (acc, v) => ({
      pedidos: acc.pedidos + v.total_pedidos,
      faturamento: acc.faturamento + v.faturamento,
      concluidos: acc.concluidos + v.concluidos,
      cancelados: acc.cancelados + v.cancelados
    }),
    { pedidos: 0, faturamento: 0, concluidos: 0, cancelados: 0 }
  )

  const taxaSucesso = totais.pedidos > 0
    ? Math.round((totais.concluidos / totais.pedidos) * 100)
    : 0

  // Get trend (compare with previous period)
  const midPoint = Math.floor(vendas.length / 2)
  const primeiraMetade = vendas.slice(0, midPoint).reduce((acc, v) => acc + v.faturamento, 0)
  const segundaMetade = vendas.slice(midPoint).reduce((acc, v) => acc + v.faturamento, 0)
  const trend = primeiraMetade > 0 ? Math.round(((segundaMetade - primeiraMetade) / primeiraMetade) * 100) : 0

  const exportCSV = () => {
    const headers = ['Data', 'Total Pedidos', 'Faturamento', 'Concluídos', 'Cancelados']
    const rows = vendas.map(v => [
      v.data,
      v.total_pedidos,
      v.faturamento,
      v.concluidos,
      v.cancelados
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-vendas-${periodo}dias.csv`
    a.click()
    URL.revokeObjectURL(url)
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
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Análise de vendas e desempenho da farmácia</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="Atualizar dados"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-medium"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">Período:</span>
          <div className="flex gap-2">
            {([7, 30, 90] as PeriodoType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  periodo === p
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p} dias
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<DollarSign className="w-6 h-6 text-primary-600" />}
          label="Faturamento Total"
          value={`${totais.faturamento.toLocaleString('pt-AO')} Kz`}
          trend={trend}
          bg="bg-primary-50"
        />
        <SummaryCard
          icon={<ShoppingCart className="w-6 h-6 text-accent-600" />}
          label="Total de Pedidos"
          value={totais.pedidos.toString()}
          bg="bg-accent-50"
        />
        <SummaryCard
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          label="Taxa de Sucesso"
          value={`${taxaSucesso}%`}
          bg="bg-green-50"
        />
        <SummaryCard
          icon={<XCircle className="w-6 h-6 text-red-600" />}
          label="Cancelamentos"
          value={totais.cancelados.toString()}
          bg="bg-red-50"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Vendas por Dia</h2>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          
          {vendas.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Sem dados de vendas para este período</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vendas.slice(-10).map((v, i) => {
                const maxFaturamento = Math.max(...vendas.map(vd => vd.faturamento))
                const percentage = maxFaturamento > 0 ? (v.faturamento / maxFaturamento) * 100 : 0
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {new Date(v.data).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                      </span>
                      <span className="font-medium">{v.faturamento.toLocaleString('pt-AO')} Kz</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Produtos Mais Vendidos</h2>
            <Package className="w-5 h-5 text-gray-400" />
          </div>

          {produtos.length === 0 ? (
            <div className="text-center py-8">
              <Pill className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Sem dados de vendas ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {produtos.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-gray-200 text-gray-700' :
                    i === 2 ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{p.nome}</p>
                    <p className="text-xs text-gray-500">
                      {p.total_vendido} unidades vendidas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {p.receita_total.toLocaleString('pt-AO')} Kz
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="card-elevated overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Histórico Detalhado</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Concluídos</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cancelados</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Faturamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Sem dados para o período selecionado
                  </td>
                </tr>
              ) : (
                vendas.map((v, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(v.data).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                      {v.total_pedidos}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {v.concluidos}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-red-600 text-sm">
                        <XCircle className="w-3.5 h-3.5" />
                        {v.cancelados}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {v.faturamento.toLocaleString('pt-AO')} Kz
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {vendas.length > 0 && (
              <tfoot className="bg-gray-50 font-medium">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Total</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-900">{totais.pedidos}</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600">{totais.concluidos}</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">{totais.cancelados}</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {totais.faturamento.toLocaleString('pt-AO')} Kz
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Sub-components
// ============================================

function SummaryCard({ icon, label, value, trend, bg }: {
  icon: React.ReactNode
  label: string
  value: string
  trend?: number
  bg: string
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <div className={`stat-icon ${bg}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}
