import { useEffect, useState } from 'react'
import {
  BarChart3, Users, DollarSign, TrendingUp,
  Loader2
} from 'lucide-react'
import {
  hospitalService,
  type FinanceiroReport,
  type MedicoReport
} from '@/services/hospitalService'

type Tab = 'financeiro' | 'medicos'

export default function RelatoriosHospital() {
  const [activeTab, setActiveTab] = useState<Tab>('financeiro')

  // Financeiro state
  const [financeiro, setFinanceiro] = useState<FinanceiroReport[]>([])
  const [finLoading, setFinLoading] = useState(true)
  const [periodo, setPeriodo] = useState(30)

  // Médicos state
  const [medicosReport, setMedicosReport] = useState<MedicoReport[]>([])
  const [medLoading, setMedLoading] = useState(true)

  // Load financial report
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setFinLoading(true)
        const data = await hospitalService.getRelatorioFinanceiro(periodo)
        if (!cancelled) setFinanceiro(data)
      } catch (err) {
        console.error('Erro ao carregar relatório financeiro:', err)
      } finally {
        if (!cancelled) setFinLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [periodo])

  // Load doctors report
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setMedLoading(true)
        const data = await hospitalService.getRelatorioMedicos()
        if (!cancelled) {
          // Sort by consultas_concluidas desc
          setMedicosReport([...data].sort((a, b) => b.consultas_concluidas - a.consultas_concluidas))
        }
      } catch (err) {
        console.error('Erro ao carregar relatório de médicos:', err)
      } finally {
        if (!cancelled) setMedLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Financial totals
  const finTotals = financeiro.reduce(
    (acc, row) => ({
      total_consultas: acc.total_consultas + row.total_consultas,
      receita_bruta: acc.receita_bruta + Number(row.receita_bruta || 0),
      receita_hospital: acc.receita_hospital + Number(row.receita_hospital || 0),
    }),
    { total_consultas: 0, receita_bruta: 0, receita_hospital: 0 }
  )

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'financeiro', label: 'Financeiro', icon: <DollarSign className="w-4 h-4" /> },
    { key: 'medicos', label: 'Médicos', icon: <Users className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-green-600" />
          Relatórios
        </h1>
        <p className="text-gray-600">Relatórios de desempenho do hospital</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              activeTab === tab.key
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'financeiro' && (
        <div className="space-y-4">
          {/* Period filter */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Período:</span>
            {[7, 15, 30, 90].map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${
                  periodo === p
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p} dias
              </button>
            ))}
          </div>

          {finLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
          ) : financeiro.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Sem dados financeiros para este período.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Consultas</th>
                      <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Valor Total</th>
                      <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Valor Hospital</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {financeiro.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {new Date(row.data).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-center">
                          {row.total_consultas}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">
                          {Number(row.receita_bruta || 0).toLocaleString('pt-AO')} Kz
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-green-700 text-right">
                          {Number(row.receita_hospital || 0).toLocaleString('pt-AO')} Kz
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-green-50 border-t-2 border-green-200">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">Total</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 text-center">
                        {finTotals.total_consultas}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                        {finTotals.receita_bruta.toLocaleString('pt-AO')} Kz
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-green-700 text-right">
                        {finTotals.receita_hospital.toLocaleString('pt-AO')} Kz
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'medicos' && (
        <div>
          {medLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
          ) : medicosReport.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Sem dados de médicos.</p>
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
                      <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Concluídas</th>
                      <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Avaliação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {medicosReport.map(med => (
                      <tr key={med.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{med.nome_completo}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {med.especialidade || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-center font-medium">
                          {med.consultas_concluidas + med.consultas_agendadas}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <TrendingUp className="w-3 h-3" />
                            {med.consultas_concluidas}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          {med.media_avaliacao != null ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                              ★ {Number(med.media_avaliacao).toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
