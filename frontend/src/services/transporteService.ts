import apiClient from '@/lib/apiClient'

// ============================================
// TYPES
// ============================================

export interface TransporteDashboard {
  entregas: {
    aguardando: number
    aceitas: number
    em_rota: number
    entregues: number
    total: number
  }
  motoristas: {
    total_motoristas: number
    motoristas_ativos: number
  }
  veiculos: {
    total_veiculos: number
    veiculos_ativos: number
  }
  faturamento: {
    faturamento_mes: number
    entregas_concluidas: number
  }
}

export interface Motorista {
  id: string
  nome_completo: string
  email: string
  telefone?: string
  avatar_url?: string
  status_conta: string
  created_at: string
  total_entregas: number
  entregas_ativas: number
}

export interface Veiculo {
  id: string
  empresa_id: string
  placa: string
  modelo: string
  tipo?: string
  capacidade_kg?: number
  is_ativo: boolean
  created_at: string
  updated_at: string
}

export interface EntregaTransporte {
  id: string
  pedido_id: string
  farmacia_id: string
  empresa_transporte_id: string
  motorista_id?: string
  veiculo_id?: string
  status: string
  valor_entrega: number
  numero_pedido: string
  valor_pedido: number
  farmacia_nome: string
  farmacia_endereco: string
  farmacia_telefone?: string
  motorista_nome?: string
  cliente_nome: string
  cliente_telefone?: string
  endereco_entrega?: string
  latitude_atual?: number
  longitude_atual?: number
  foto_comprovante?: string
  observacoes?: string
  aceita_em?: string
  recolhido_em?: string
  entregue_em?: string
  created_at: string
  updated_at: string
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

export const transporteService = {
  // ---- GERENTE ----

  async getDashboard(): Promise<TransporteDashboard> {
    return apiClient.get<TransporteDashboard>('/transporte/dashboard')
  },

  // Motoristas
  async getMotoristas(): Promise<Motorista[]> {
    return apiClient.get<Motorista[]>('/transporte/motoristas')
  },

  async addMotorista(data: {
    nome_completo: string
    email: string
    telefone?: string
  }) {
    return apiClient.post('/transporte/motoristas', data)
  },

  async deleteMotorista(id: string) {
    return apiClient.delete(`/transporte/motoristas/${id}`)
  },

  // Veículos
  async getVeiculos(): Promise<Veiculo[]> {
    return apiClient.get<Veiculo[]>('/transporte/veiculos')
  },

  async addVeiculo(data: {
    placa: string
    modelo: string
    tipo?: string
    capacidade_kg?: number
  }) {
    return apiClient.post('/transporte/veiculos', data)
  },

  async updateVeiculo(id: string, data: Partial<{
    placa: string
    modelo: string
    tipo: string
    capacidade_kg: number
  }>) {
    return apiClient.put(`/transporte/veiculos/${id}`, data)
  },

  async deleteVeiculo(id: string) {
    return apiClient.delete(`/transporte/veiculos/${id}`)
  },

  // Entregas
  async getEntregas(params?: {
    status?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<EntregaTransporte>> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    return apiClient.get(`/transporte/entregas?${searchParams.toString()}`)
  },

  async atribuirEntrega(id: string, data: {
    motorista_id: string
    veiculo_id?: string
  }) {
    return apiClient.put(`/transporte/entregas/${id}/atribuir`, data)
  },

  // ---- MOTORISTA ----

  async getMinhasEntregas(status?: string): Promise<EntregaTransporte[]> {
    const params = status ? `?status=${status}` : ''
    return apiClient.get<EntregaTransporte[]>(`/transporte/motorista/entregas${params}`)
  },

  async updateGPS(id: string, data: {
    latitude: number
    longitude: number
  }) {
    return apiClient.put(`/transporte/motorista/entregas/${id}/gps`, data)
  },

  async recolherEntrega(id: string) {
    return apiClient.put(`/transporte/motorista/entregas/${id}/recolher`, {})
  },

  async entregarPedido(id: string, data?: {
    foto_comprovante?: string
    observacoes?: string
  }) {
    return apiClient.put(`/transporte/motorista/entregas/${id}/entregar`, data || {})
  },
}
