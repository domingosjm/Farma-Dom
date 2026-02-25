import apiClient from '@/lib/apiClient'

export interface ItemPedido {
  medicamento_id: string
  quantidade: number
  preco_unitario: number
}

export interface Pedido {
  id: string
  usuario_id: string
  numero_pedido: string
  status: 'pendente' | 'confirmado' | 'em_preparacao' | 'enviado' | 'entregue' | 'cancelado'
  total: number
  subtotal: number
  taxa_entrega: number
  desconto: number
  metodo_pagamento: string
  endereco_entrega: string
  observacoes?: string
  data_entrega_estimada?: string
  created_at: string
  updated_at: string
  itens?: any[]
}

export interface CreatePedidoData {
  itens: ItemPedido[]
  subtotal?: number
  taxa_entrega?: number
  desconto?: number
  total?: number
  metodo_pagamento: string
  endereco_entrega: string
  cidade?: string
  provincia?: string
  observacoes?: string
}

export const pedidosService = {
  // Criar novo pedido
  async createPedido(data: CreatePedidoData): Promise<Pedido> {
    return await apiClient.post<Pedido>('/pedidos', data)
  },

  // Listar pedidos do usuário
  async getPedidos(): Promise<Pedido[]> {
    return await apiClient.get<Pedido[]>('/pedidos')
  },

  // Buscar pedido por ID
  async getPedidoById(id: string): Promise<Pedido> {
    return await apiClient.get<Pedido>(`/pedidos/${id}`)
  },

  // Cancelar pedido
  async cancelPedido(id: string): Promise<{ message: string }> {
    return await apiClient.put<{ message: string }>(`/pedidos/${id}/cancelar`)
  },
}
