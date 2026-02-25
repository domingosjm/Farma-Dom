import apiClient from '@/lib/apiClient';

export interface MedicoStats {
  consultas_hoje: number;
  consultas_semana: number;
  pacientes_total: number;
  proxima_consulta: ProximaConsulta | null;
  avaliacoes_media: number;
  total_avaliacoes: number;
  receita_mes: number;
}

export interface ProximaConsulta {
  id: string;
  paciente_nome: string;
  data_consulta: string;
  tipo_consulta: string;
  status: string;
}

export interface ConsultaDia {
  id: string;
  paciente_nome: string;
  data_consulta: string;
  tipo_consulta: string;
  status: string;
  sintomas?: string;
  foto_perfil?: string;
}

export interface ConsultaDetalhada extends ConsultaDia {
  diagnostico?: string;
  prescricao?: string;
  observacoes?: string;
  valor_consulta?: number;
  chat_ativo?: boolean;
  paciente_telefone?: string;
  paciente_email?: string;
}

export interface Paciente {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  foto_perfil?: string;
  data_nascimento?: string;
  genero?: string;
  total_consultas: number;
  ultima_consulta: string;
}

export interface PerfilMedico {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  foto_perfil?: string;
  numero_ordem?: string;
  especialidade?: string;
  anos_experiencia?: number;
  biografia?: string;
  atende_domicilio: boolean;
  atende_online: boolean;
  valor_consulta_online?: number;
  valor_consulta_domicilio?: number;
  disponivel: boolean;
}

const medicoService = {
  // Obter estatísticas do dashboard
  async getStats(): Promise<MedicoStats> {
    return await apiClient.get<MedicoStats>('/medico/stats');
  },

  // Obter consultas de hoje
  async getConsultasHoje(): Promise<ConsultaDia[]> {
    return await apiClient.get<ConsultaDia[]>('/medico/consultas-hoje');
  },

  // Obter todas as consultas
  async getConsultas(params?: {
    status?: string;
    data_inicio?: string;
    data_fim?: string;
  }): Promise<ConsultaDetalhada[]> {
    return await apiClient.get<ConsultaDetalhada[]>('/medico/consultas', params);
  },

  // Iniciar consulta
  async iniciarConsulta(consultaId: string): Promise<void> {
    await apiClient.put(`/medico/consultas/${consultaId}/iniciar`);
  },

  // Concluir consulta
  async concluirConsulta(
    consultaId: string,
    data: {
      diagnostico?: string;
      prescricao?: string;
      observacoes?: string;
    }
  ): Promise<void> {
    await apiClient.put(`/medico/consultas/${consultaId}/concluir`, data);
  },

  // Obter lista de pacientes
  async getPacientes(): Promise<Paciente[]> {
    return await apiClient.get<Paciente[]>('/medico/pacientes');
  },

  // Obter histórico de um paciente
  async getHistoricoPaciente(pacienteId: string): Promise<ConsultaDetalhada[]> {
    return await apiClient.get<ConsultaDetalhada[]>(`/medico/pacientes/${pacienteId}/historico`);
  },

  // Obter perfil profissional
  async getPerfil(): Promise<PerfilMedico> {
    return await apiClient.get<PerfilMedico>('/medico/perfil');
  },

  // Atualizar disponibilidade
  async atualizarDisponibilidade(disponivel: boolean): Promise<void> {
    await apiClient.put('/medico/disponibilidade', { disponivel });
  },
};

export default medicoService;
