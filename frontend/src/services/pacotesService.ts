import apiClient from '@/lib/apiClient'

export interface PacoteSaude {
  id: string
  nome: string
  descricao?: string
  preco_mensal: number
  duracao_meses: number
  beneficios: string[]
  tipo: 'individual' | 'familiar' | 'premium'
  limite_consultas?: number | null
  desconto_medicamentos?: number
  is_ativo: boolean
  created_at: string
  updated_at: string
}

export interface AssinaturaPacote {
  id: string
  usuario_id: string
  pacote_id: string
  data_inicio: string
  data_fim: string
  status: 'ativa' | 'suspensa' | 'cancelada' | 'expirada'
  valor_pago?: number
  created_at: string
  updated_at: string
}

export interface AssinarPacoteData {
  metodo_pagamento: 'cartao' | 'multicaixa' | 'transferencia'
  dados_pagamento?: any
}

export interface AssinaturaDetalhada extends AssinaturaPacote {
  pacote_nome?: string
  pacote_descricao?: string
  preco_mensal?: number
  tipo?: string
  beneficios?: string[]
}

export interface PagamentoHistorico {
  id: string
  assinatura_id: string
  usuario_id: string
  pacote_id: string
  pacote_nome: string
  valor: number
  metodo_pagamento: 'cartao' | 'multicaixa' | 'transferencia'
  status: 'pendente' | 'aprovado' | 'recusado' | 'cancelado'
  referencia_pagamento: string
  data_pagamento: string
  created_at: string
  data_inicio: string
  data_fim: string
}

export interface EstatisticasUso {
  has_subscription: boolean
  pacote_nome?: string
  data_inicio?: string
  data_fim?: string
  status?: string
  consultas?: {
    usadas: number
    disponiveis: number | 'Ilimitadas'
    percentual: number
  }
  medicamentos?: {
    pedidos: number
    desconto: number
    economizado: number
  }
}

export interface UpgradeData {
  novo_pacote_id: string
  metodo_pagamento: 'cartao' | 'multicaixa' | 'transferencia'
}

export const pacotesService = {
  // Listar todos os pacotes disponíveis
  async getPacotes(): Promise<PacoteSaude[]> {
    return await apiClient.get<PacoteSaude[]>('/pacotes')
  },

  // Buscar pacote por ID
  async getPacoteById(id: string): Promise<PacoteSaude> {
    return await apiClient.get<PacoteSaude>(`/pacotes/${id}`)
  },

  // Assinar um pacote
  async assinarPacote(pacoteId: string, data: AssinarPacoteData): Promise<{ message: string; assinatura_id: string }> {
    return await apiClient.post(`/pacotes/${pacoteId}/assinar`, data)
  },

  // Listar assinaturas do usuário
  async getMinhasAssinaturas(): Promise<AssinaturaDetalhada[]> {
    return await apiClient.get<AssinaturaDetalhada[]>('/pacotes/user/assinaturas')
  },

  // Buscar assinatura ativa
  async getAssinaturaAtiva(): Promise<AssinaturaDetalhada | null> {
    return await apiClient.get<AssinaturaDetalhada | null>('/pacotes/user/assinatura-ativa')
  },

  // Cancelar assinatura
  async cancelarAssinatura(assinaturaId: string): Promise<AssinaturaPacote> {
    return await apiClient.put<AssinaturaPacote>(`/pacotes/assinaturas/${assinaturaId}/cancelar`)
  },

  // Histórico de pagamentos
  async getHistoricoPagamentos(): Promise<PagamentoHistorico[]> {
    return await apiClient.get<PagamentoHistorico[]>('/pacotes/pagamentos/historico')
  },

  // Fazer upgrade/downgrade de plano
  async upgradePlano(assinaturaId: string, data: UpgradeData): Promise<{ message: string; assinatura_id: string }> {
    return await apiClient.post(`/pacotes/assinaturas/${assinaturaId}/upgrade`, data)
  },

  // Estatísticas de uso
  async getEstatisticasUso(): Promise<EstatisticasUso> {
    return await apiClient.get<EstatisticasUso>('/pacotes/uso/estatisticas')
  }
}
