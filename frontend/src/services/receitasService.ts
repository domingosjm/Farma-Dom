import apiClient from '@/lib/apiClient'

// ============================================
// TYPES
// ============================================

export interface ReceitaDigital {
  id: string
  consulta_id?: string
  medico_id: string
  paciente_id: string
  codigo_verificacao: string
  qr_code_hash: string
  validade: string
  status: string
  farmacia_dispensou_id?: string
  dispensado_em?: string
  medico_nome: string
  medico_especialidade?: string
  medico_crm?: string
  paciente_nome: string
  farmacia_dispensou_nome?: string
  itens: ItemReceita[] | null
  created_at: string
  updated_at: string
}

export interface ItemReceita {
  id?: string
  medicamento_id: string
  nome: string
  principio_ativo?: string
  quantidade: number
  dosagem: string
  instrucoes?: string
}

export interface CreateReceitaData {
  consulta_id?: string
  paciente_id: string
  validade_dias?: number
  itens: {
    medicamento_id: string
    quantidade: number
    dosagem: string
    instrucoes?: string
  }[]
}

export interface ReceitaVerificacao extends ReceitaDigital {
  is_valida: boolean
  motivo_invalida: string | null
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

// ============================================
// SERVICE
// ============================================

export const receitasService = {
  // Médico: Criar receita
  async criarReceita(data: CreateReceitaData): Promise<ReceitaDigital> {
    return apiClient.post<ReceitaDigital>('/receitas', data)
  },

  // Verificar receita por código
  async verificarReceita(codigo: string): Promise<ReceitaVerificacao> {
    return apiClient.get<ReceitaVerificacao>(`/receitas/verificar/${codigo}`)
  },

  // Paciente: Minhas receitas
  async getMinhasReceitas(params?: {
    status?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<ReceitaDigital>> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    return apiClient.get(`/receitas/minhas?${searchParams.toString()}`)
  },

  // Médico: Receitas emitidas
  async getReceitasEmitidas(params?: {
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<ReceitaDigital>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    return apiClient.get(`/receitas/emitidas?${searchParams.toString()}`)
  },

  // Detalhes de uma receita
  async getReceita(id: string): Promise<ReceitaDigital> {
    return apiClient.get<ReceitaDigital>(`/receitas/${id}`)
  },

  // Farmácia: Dispensar receita
  async dispensarReceita(id: string): Promise<ReceitaDigital> {
    return apiClient.put<ReceitaDigital>(`/receitas/${id}/dispensar`, {})
  },

  // Médico: Cancelar receita
  async cancelarReceita(id: string): Promise<ReceitaDigital> {
    return apiClient.put<ReceitaDigital>(`/receitas/${id}/cancelar`, {})
  },
}
