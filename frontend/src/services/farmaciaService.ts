import apiClient from '@/lib/apiClient'

// ============================================
// TYPES
// ============================================

export interface FarmaciaDashboard {
  pedidos: {
    pedidos_pendentes: number
    pedidos_preparando: number
    pedidos_prontos: number
    pedidos_entregues: number
    total_pedidos: number
  }
  estoque: {
    total_produtos: number
    estoque_baixo: number
    sem_estoque: number
  }
  faturamento: {
    faturamento_mes: number
    pedidos_concluidos: number
  }
  rodizio: {
    rodizio_pendentes: number
    rodizio_aceitos: number
    rodizio_recusados: number
  }
}

export interface FarmaciaPerfil {
  id: string
  nome: string
  endereco?: string
  cidade?: string
  provincia?: string
  zona?: string
  latitude?: number
  longitude?: number
  telefone?: string
  email?: string
  logo_url?: string
  licenca?: string
  horario_funcionamento?: Record<string, { abre: string; fecha: string }>
  aceita_parcelamento: boolean
  is_online: boolean
  is_ativa: boolean
  total_produtos: number
  total_vendas: number
  created_at: string
}

export interface EstoqueItem {
  id: string
  medicamento_id: string
  quantidade: number
  preco_farmacia: number | null
  updated_at: string
  nome: string
  principio_ativo?: string
  dosagem?: string
  forma_farmaceutica?: string
  categoria?: string
  preco_referencia: number
  requer_receita: boolean
  imagem_url?: string
}

export interface PedidoFarmacia {
  id: string
  usuario_id: string
  farmacia_id: string
  numero_pedido: string
  status: string
  total: number
  subtotal: number
  taxa_entrega: number
  desconto: number
  metodo_pagamento: string
  endereco_entrega?: string
  zona_entrega?: string
  observacoes?: string
  parcelado: boolean
  numero_parcelas: number
  created_at: string
  updated_at: string
  cliente_nome: string
  cliente_telefone?: string
  cliente_email?: string
  itens: {
    id: string
    medicamento_id: string
    nome: string
    dosagem?: string
    forma_farmaceutica?: string
    quantidade: number
    preco_unitario: number
    subtotal: number
    requer_receita?: boolean
  }[] | null
  entrega?: {
    id: string
    status: string
    motorista_nome?: string
    motorista_telefone?: string
  } | null
}

export interface RodizioItem {
  id: string
  pedido_id: string
  farmacia_id: string
  posicao: number
  status: string
  enviado_em?: string
  numero_pedido: string
  total: number
  zona_entrega?: string
  endereco_entrega?: string
  cliente_nome: string
  itens: { nome: string; quantidade: number }[] | null
}

export interface Funcionario {
  id: string
  nome_completo: string
  email: string
  telefone?: string
  tipo_usuario: string
  status_conta: string
  avatar_url?: string
  created_at: string
}

export interface VendasReport {
  data: string
  total_pedidos: number
  faturamento: number
  concluidos: number
  cancelados: number
}

export interface ProdutoMaisVendido {
  id: string
  nome: string
  categoria?: string
  total_vendido: number
  receita_total: number
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

export const farmaciaService = {
  // Dashboard
  async getDashboard(): Promise<FarmaciaDashboard> {
    return apiClient.get<FarmaciaDashboard>('/farmacia/dashboard')
  },

  // Perfil
  async getPerfil(): Promise<FarmaciaPerfil> {
    return apiClient.get<FarmaciaPerfil>('/farmacia/perfil')
  },

  async updatePerfil(data: Partial<FarmaciaPerfil>): Promise<FarmaciaPerfil> {
    return apiClient.put<FarmaciaPerfil>('/farmacia/perfil', data)
  },

  async setOnline(isOnline: boolean): Promise<{ id: string; is_online: boolean }> {
    return apiClient.put('/farmacia/online', { is_online: isOnline })
  },

  // Estoque
  async getEstoque(params?: {
    search?: string
    categoria?: string
    baixo_estoque?: boolean
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<EstoqueItem>> {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    if (params?.categoria) searchParams.set('categoria', params.categoria)
    if (params?.baixo_estoque) searchParams.set('baixo_estoque', 'true')
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    return apiClient.get(`/farmacia/estoque?${searchParams.toString()}`)
  },

  async addEstoque(data: {
    medicamento_id: string
    quantidade: number
    preco_farmacia?: number
  }) {
    return apiClient.post('/farmacia/estoque', data)
  },

  async updateEstoque(id: string, data: {
    quantidade?: number
    preco_farmacia?: number | null
  }) {
    return apiClient.put(`/farmacia/estoque/${id}`, data)
  },

  async deleteEstoque(id: string) {
    return apiClient.delete(`/farmacia/estoque/${id}`)
  },

  async bulkUpdateEstoque(items: {
    medicamento_id: string
    quantidade: number
    preco_farmacia?: number
  }[]) {
    return apiClient.post('/farmacia/estoque/bulk', { items })
  },

  // Pedidos
  async getPedidos(params?: {
    status?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<PedidoFarmacia>> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    return apiClient.get(`/farmacia/pedidos?${searchParams.toString()}`)
  },

  async getPedido(id: string): Promise<PedidoFarmacia> {
    return apiClient.get(`/farmacia/pedidos/${id}`)
  },

  async aceitarPedido(id: string) {
    return apiClient.put(`/farmacia/pedidos/${id}/aceitar`, {})
  },

  async recusarPedido(id: string, motivo: string) {
    return apiClient.put(`/farmacia/pedidos/${id}/recusar`, { motivo })
  },

  async marcarPronto(id: string) {
    return apiClient.put(`/farmacia/pedidos/${id}/pronto`, {})
  },

  // Rodízio
  async getRodizio(): Promise<RodizioItem[]> {
    return apiClient.get('/farmacia/rodizio')
  },

  // Catálogo
  async getCatalogo(params?: {
    search?: string
    categoria?: string
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    if (params?.categoria) searchParams.set('categoria', params.categoria)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    return apiClient.get(`/farmacia/catalogo?${searchParams.toString()}`)
  },

  // Funcionários
  async getFuncionarios(): Promise<Funcionario[]> {
    return apiClient.get('/farmacia/funcionarios')
  },

  async addFuncionario(data: {
    nome_completo: string
    email: string
    telefone?: string
  }) {
    return apiClient.post('/farmacia/funcionarios', data)
  },

  async deleteFuncionario(id: string) {
    return apiClient.delete(`/farmacia/funcionarios/${id}`)
  },

  // Relatórios
  async getVendasReport(periodo?: number): Promise<VendasReport[]> {
    return apiClient.get(`/farmacia/relatorios/vendas${periodo ? `?periodo=${periodo}` : ''}`)
  },

  async getProdutosMaisVendidos(limit?: number): Promise<ProdutoMaisVendido[]> {
    return apiClient.get(`/farmacia/relatorios/produtos-mais-vendidos${limit ? `?limit=${limit}` : ''}`)
  },
}
