import apiClient from '@/lib/apiClient'

export interface DashboardStats {
  total_consultas: number
  consultas_pendentes: number
  consultas_concluidas: number
  proxima_consulta?: {
    id: string
    data_hora_agendada: string
    especialidade?: string
    tipo_consulta: string
  }
  assinatura_ativa?: {
    pacote_nome: string
    data_fim: string
  }
}

export const dashboardService = {
  // Obter estatísticas do dashboard
  async getStats(): Promise<DashboardStats> {
    return await apiClient.get<DashboardStats>('/dashboard/stats')
  },

  // Obter resumo da conta
  async getAccountSummary() {
    const [user, consultas] = await Promise.all([
      apiClient.get('/auth/me'),
      apiClient.get('/consultas?limit=5'),
    ])

    return {
      user,
      consultas,
    }
  },
}
