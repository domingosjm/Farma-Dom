import apiClient from '@/lib/apiClient'

export interface Medicamento {
  id: string
  nome: string
  principio_ativo?: string
  categoria: string
  forma_farmaceutica?: string
  dosagem?: string
  fabricante?: string
  preco: number
  estoque: number
  requer_receita: boolean
  descricao?: string
  indicacoes?: string
  contraindicacoes?: string
  efeitos_colaterais?: string
  imagem_url?: string
  is_ativo: boolean
  created_at: string
  updated_at: string
}

export interface MedicamentosFilter {
  categoria?: string
  search?: string
  limit?: number
  offset?: number
}

export const medicamentosService = {
  // Listar medicamentos com filtros
  async getMedicamentos(filters?: MedicamentosFilter): Promise<Medicamento[]> {
    const params: Record<string, any> = {}
    
    if (filters?.categoria) params.categoria = filters.categoria
    if (filters?.search) params.search = filters.search
    if (filters?.limit) params.limit = filters.limit.toString()
    if (filters?.offset) params.offset = filters.offset.toString()
    
    return await apiClient.get<Medicamento[]>('/medicamentos', params)
  },

  // Buscar medicamento por ID
  async getMedicamentoById(id: string): Promise<Medicamento> {
    return await apiClient.get<Medicamento>(`/medicamentos/${id}`)
  },

  // Buscar medicamentos por categoria
  async getMedicamentosByCategoria(categoria: string): Promise<Medicamento[]> {
    return await this.getMedicamentos({ categoria })
  },

  // Buscar medicamentos por termo
  async searchMedicamentos(search: string): Promise<Medicamento[]> {
    return await this.getMedicamentos({ search })
  },

  // Alias para compatibilidade
  async list(filters?: MedicamentosFilter): Promise<Medicamento[]> {
    return await this.getMedicamentos(filters)
  },

  // Obter categorias únicas
  async getCategories(): Promise<string[]> {
    try {
      const medicamentos = await this.getMedicamentos()
      const categorias = [...new Set(medicamentos.map(m => m.categoria).filter(Boolean))]
      return categorias
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
      return []
    }
  },

  // Criar pedido (placeholder - implementar rota depois)
  async criarPedido(_userId: string, data: any) {
    // Usar pedidosService em vez disso
    const { itens, endereco_entrega, observacoes, metodo_pagamento } = data
    
    // Importar dinamicamente o pedidosService
    const { pedidosService } = await import('./pedidosService')
    
    return await pedidosService.createPedido({
      itens,
      endereco_entrega,
      cidade: '',
      provincia: '',
      metodo_pagamento,
      observacoes,
    })
  },
}
