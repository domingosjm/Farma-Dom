import apiClient from '@/lib/apiClient'

export interface Consulta {
  id: string
  paciente_id: string
  medico_id?: string
  nome_paciente?: string
  nome_medico?: string
  tipo_consulta: 'presencial' | 'video' | 'audio' | 'chat'
  especialidade: string
  data_hora_agendada: string
  duracao_minutos?: number
  data_hora_realizada?: string
  status: 'agendada' | 'confirmada' | 'em_andamento' | 'concluida' | 'cancelada'
  sintomas?: string
  diagnostico?: string
  prescricao?: string
  observacoes?: string
  valor: number
  created_at: string
  updated_at: string
}

export interface CreateConsultaData {
  tipo_consulta: 'presencial' | 'video' | 'audio' | 'chat'
  especialidade: string
  data_hora_agendada: string
  sintomas?: string
  valor: number
}

export const consultasService = {
  // Listar consultas do usuário
  async getConsultas(): Promise<Consulta[]> {
    return await apiClient.get<Consulta[]>('/consultas')
  },

  // Criar nova consulta
  async createConsulta(data: CreateConsultaData): Promise<Consulta> {
    return await apiClient.post<Consulta>('/consultas', data)
  },

  // Buscar consulta por ID
  async getConsultaById(id: string): Promise<Consulta> {
    return await apiClient.get<Consulta>(`/consultas/${id}`)
  },

  // Cancelar consulta
  async cancelConsulta(id: string): Promise<{ message: string }> {
    return await apiClient.put<{ message: string }>(`/consultas/${id}/cancelar`, {})
  },

  // Buscar horários disponíveis
  async getHorariosDisponiveis(data: string, especialidade?: string): Promise<string[]> {
    const params = new URLSearchParams({ data });
    if (especialidade) params.append('especialidade', especialidade);
    return await apiClient.get<string[]>(`/consultas/horarios-disponiveis?${params}`)
  },

  // Iniciar consulta (mudar status para em_andamento)
  async iniciarConsulta(id: string): Promise<{ message: string }> {
    return await apiClient.put<{ message: string }>(`/consultas/${id}/iniciar`, {})
  },

  // Finalizar consulta
  async finalizarConsulta(id: string, dados: {
    diagnostico?: string;
    prescricao?: string;
    observacoes?: string;
    duracao_minutos?: number;
  }): Promise<{ message: string }> {
    return await apiClient.put<{ message: string }>(`/consultas/${id}/finalizar`, dados)
  },
}

