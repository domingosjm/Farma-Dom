import apiClient from '@/lib/apiClient'

// ============================================
// TYPES
// ============================================

export interface HospitalDashboard {
  medicos: {
    total_medicos: number
    medicos_ativos: number
  }
  consultas: {
    consultas_agendadas: number
    consultas_em_andamento: number
    consultas_concluidas: number
    total_consultas: number
  }
  faturamento: {
    consultas_concluidas_mes: number
    receita_bruta: number
    receita_hospital: number
  }
}

export interface HospitalPerfil {
  id: string
  nome: string
  endereco?: string
  cidade?: string
  provincia?: string
  telefone?: string
  email?: string
  tipo?: 'publico' | 'privado'
  especialidades?: string[]
  is_ativo: boolean
  latitude?: number
  longitude?: number
  total_medicos: number
  total_consultas: number
  created_at: string
  updated_at?: string
}

export interface MedicoHospital {
  id: string
  nome_completo: string
  email: string
  telefone?: string
  avatar_url?: string
  status_conta: string
  especialidade?: string
  numero_ordem?: string
  is_disponivel: boolean
  total_consultas: number
  consultas_agendadas: number
}

export interface ConsultaHospital {
  id: string
  medico_id: string
  paciente_id: string
  hospital_id: string
  tipo: string
  status: string
  data_hora_agendada: string
  preco: number
  medico_nome: string
  especialidade?: string
  paciente_nome: string
  created_at: string
  updated_at: string
}

export interface FinanceiroReport {
  data: string
  total_consultas: number
  receita_bruta: number
  receita_hospital: number
}

export interface MedicoReport {
  id: string
  nome_completo: string
  especialidade?: string
  consultas_concluidas: number
  consultas_agendadas: number
  receita_gerada: number
  media_avaliacao: number | null
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

export const hospitalService = {
  // Dashboard
  async getDashboard(): Promise<HospitalDashboard> {
    return apiClient.get<HospitalDashboard>('/hospital/dashboard')
  },

  // Perfil
  async getPerfil(): Promise<HospitalPerfil> {
    return apiClient.get<HospitalPerfil>('/hospital/perfil')
  },

  async updatePerfil(data: Partial<HospitalPerfil>): Promise<HospitalPerfil> {
    return apiClient.put<HospitalPerfil>('/hospital/perfil', data)
  },

  // Médicos
  async getMedicos(): Promise<MedicoHospital[]> {
    return apiClient.get<MedicoHospital[]>('/hospital/medicos')
  },

  async vincularMedico(medico_id: string) {
    return apiClient.post('/hospital/medicos/vincular', { medico_id })
  },

  async desvincularMedico(id: string) {
    return apiClient.delete(`/hospital/medicos/${id}/desvincular`)
  },

  // Consultas
  async getConsultas(params?: {
    status?: string
    medico_id?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<ConsultaHospital>> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.medico_id) searchParams.set('medico_id', params.medico_id)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    return apiClient.get(`/hospital/consultas?${searchParams.toString()}`)
  },

  // Relatórios
  async getRelatorioFinanceiro(periodo?: number): Promise<FinanceiroReport[]> {
    return apiClient.get(`/hospital/relatorios/financeiro${periodo ? `?periodo=${periodo}` : ''}`)
  },

  async getRelatorioMedicos(): Promise<MedicoReport[]> {
    return apiClient.get<MedicoReport[]>('/hospital/relatorios/medicos')
  },
}
