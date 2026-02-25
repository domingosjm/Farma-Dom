import apiClient from '@/lib/apiClient'

export interface AdminStats {
  total_usuarios: number
  total_consultas: number
  total_pedidos: number
  receita_total: number
  usuarios_ativos: number
  consultas_hoje: number
  total_farmacias: number
  total_hospitais: number
  total_transportes: number
  pendentes_aprovacao: number
  farmacias_pendentes: number
  hospitais_pendentes: number
  transportes_pendentes: number
  total_pendentes: number
}

export interface Atividade {
  tipo: 'pedido' | 'usuario' | 'consulta'
  id: string
  texto: string
  detalhes: string
  status?: string
  created_at: string
}

export interface AprovacoesPendentes {
  farmacias: any[]
  hospitais: any[]
  transportes: any[]
  usuarios: any[]
  total: number
}

export const adminService = {
  // Obter estatísticas administrativas
  async getStats(): Promise<AdminStats> {
    return await apiClient.get<AdminStats>('/admin/stats')
  },

  // Obter atividades recentes
  async getAtividades(limit: number = 10): Promise<Atividade[]> {
    return await apiClient.get<Atividade[]>('/admin/atividades', { limit: limit.toString() })
  },

  // ============================================
  // APROVAÇÕES
  // ============================================
  
  // Obter todas as aprovações pendentes
  async getAprovacoesPendentes(): Promise<AprovacoesPendentes> {
    return await apiClient.get<AprovacoesPendentes>('/admin/aprovacoes/pendentes')
  },

  // Aprovar farmácia
  async aprovarFarmacia(id: string) {
    return await apiClient.post(`/admin/farmacias/${id}/aprovar`)
  },

  // Rejeitar farmácia
  async rejeitarFarmacia(id: string, motivo?: string) {
    return await apiClient.post(`/admin/farmacias/${id}/rejeitar`, { motivo })
  },

  // Aprovar hospital
  async aprovarHospital(id: string) {
    return await apiClient.post(`/admin/hospitais/${id}/aprovar`)
  },

  // Rejeitar hospital
  async rejeitarHospital(id: string, motivo?: string) {
    return await apiClient.post(`/admin/hospitais/${id}/rejeitar`, { motivo })
  },

  // Aprovar empresa de transporte
  async aprovarTransporte(id: string) {
    return await apiClient.post(`/admin/transportes/${id}/aprovar`)
  },

  // Rejeitar empresa de transporte
  async rejeitarTransporte(id: string, motivo?: string) {
    return await apiClient.post(`/admin/transportes/${id}/rejeitar`, { motivo })
  },

  // Aprovar usuário
  async aprovarUsuario(id: string) {
    return await apiClient.post(`/admin/usuarios/${id}/aprovar`)
  },

  // Rejeitar usuário
  async rejeitarUsuario(id: string, motivo?: string) {
    return await apiClient.post(`/admin/usuarios/${id}/rejeitar`, { motivo })
  },

  // Listar todas as farmácias
  async getFarmacias() {
    return await apiClient.get('/admin/farmacias')
  },

  // Listar todos os hospitais
  async getHospitais() {
    return await apiClient.get('/admin/hospitais')
  },

  // ============================================
  // USUÁRIOS
  // ============================================

  // Listar todos os usuários
  async getUsuarios(filters?: { tipo?: string; search?: string }) {
    return await apiClient.get('/admin/usuarios', filters)
  },

  // Buscar usuário por ID
  async getUsuarioById(id: string) {
    return await apiClient.get(`/admin/usuarios/${id}`)
  },

  // Atualizar usuário
  async updateUsuario(id: string, data: any) {
    return await apiClient.put(`/admin/usuarios/${id}`, data)
  },

  // Desativar usuário
  async deactivateUsuario(id: string) {
    return await apiClient.delete(`/admin/usuarios/${id}`)
  },

  // Listar todas as consultas
  async getAllConsultas(filters?: { status?: string; data_inicio?: string; data_fim?: string }) {
    return await apiClient.get('/admin/consultas', filters)
  },

  // Listar todos os pedidos
  async getAllPedidos(filters?: { status?: string }) {
    return await apiClient.get('/admin/pedidos', filters)
  },

  // Atualizar status do pedido
  async updatePedidoStatus(id: string, status: string) {
    return await apiClient.put(`/admin/pedidos/${id}/status`, { status })
  },

  // Métodos para medicamentos (placeholder - implementar rotas depois)
  async getMedicamentos() {
    return await apiClient.get('/medicamentos')
  },

  async createMedicamento(_data: any) {
    // TODO: Implementar rota POST /admin/medicamentos
    throw new Error('Rota não implementada')
  },

  async updateMedicamento(_id: string, _data: any) {
    // TODO: Implementar rota PUT /admin/medicamentos/:id
    throw new Error('Rota não implementada')
  },

  async deleteMedicamento(_id: string) {
    // TODO: Implementar rota DELETE /admin/medicamentos/:id
    throw new Error('Rota não implementada')
  },

  // Métodos para pacotes (placeholder - implementar rotas depois)
  async getPacotes() {
    return await apiClient.get('/pacotes')
  },

  async createPacote(_data: any) {
    // TODO: Implementar rota POST /admin/pacotes
    throw new Error('Rota não implementada')
  },

  async updatePacote(_id: string, _data: any) {
    // TODO: Implementar rota PUT /admin/pacotes/:id
    throw new Error('Rota não implementada')
  },

  async deletePacote(_id: string) {
    // TODO: Implementar rota DELETE /admin/pacotes/:id
    throw new Error('Rota não implementada')
  },

  // Ativar/desativar usuário
  async toggleUsuario(id: string, is_ativo: boolean) {
    return await apiClient.put(`/admin/usuarios/${id}`, { is_ativo })
  },

  // Obter pedidos (alias para getAllPedidos)
  async getPedidos(filters?: { status?: string }) {
    return await this.getAllPedidos(filters)
  }
}
