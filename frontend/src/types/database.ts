// ========================================
// FarmaDom Types — Multi-Entity Platform
// ========================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ---- Enums ----
export type TipoUsuario =
  | 'paciente'
  | 'medico'
  | 'farmacia_admin'
  | 'farmacia_funcionario'
  | 'farmaceutico'
  | 'hospital_gerente'
  | 'transporte_gerente'
  | 'motorista'
  | 'entregador'
  | 'enfermeiro'
  | 'admin';

export type StatusConta = 'pendente_aprovacao' | 'aprovada' | 'suspensa' | 'rejeitada';
export type TipoConsulta = 'presencial' | 'video' | 'audio' | 'chat';
export type StatusConsulta = 'agendada' | 'confirmada' | 'em_andamento' | 'concluida' | 'cancelada' | 'no_show';
export type StatusPedido = 'aguardando_farmacia' | 'aceite_farmacia' | 'preparando' | 'pronto_retirada' | 'em_entrega' | 'entregue' | 'cancelado' | 'recusado';
export type StatusEntrega = 'aguardando_coleta' | 'coletado' | 'em_transito' | 'entregue' | 'falha_entrega';
export type StatusReceita = 'ativa' | 'utilizada' | 'expirada' | 'cancelada';
export type TipoEntidade = 'farmacia' | 'hospital' | 'empresa_transporte';

// ---- Core Models ----
export interface Usuario {
  id: string;
  email: string;
  nome_completo: string;
  telefone: string;
  data_nascimento?: string | null;
  genero?: string | null;
  nif?: string | null;
  tipo_usuario: TipoUsuario;
  status_conta: StatusConta;
  foto_perfil?: string | null;
  endereco_completo?: string | null;
  cidade?: string | null;
  provincia?: string | null;
  is_ativo: boolean;
  entidade_id?: string | null;
  entidade_tipo?: TipoEntidade | null;
  created_at: string;
  updated_at: string;
}

export interface Hospital {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  provincia: string;
  telefone: string;
  email: string;
  tipo: 'publico' | 'privado';
  especialidades: string[];
  is_ativo: boolean;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface Farmacia {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  provincia: string;
  zona: string;
  telefone: string;
  email: string;
  nif: string;
  alvara: string;
  is_online: boolean;
  horario_abertura: string;
  horario_fechamento: string;
  latitude?: number;
  longitude?: number;
  penalidade_rodizio?: string | null;
  ultimo_pedido_recebido?: string | null;
  is_ativa: boolean;
  created_at: string;
}

export interface EmpresaTransporte {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  cidade: string;
  provincia: string;
  numero_veiculos: number;
  zonas_cobertura: string[];
  is_ativa: boolean;
  created_at: string;
}

export interface Veiculo {
  id: string;
  empresa_id: string;
  motorista_id?: string | null;
  placa: string;
  modelo: string;
  tipo: 'moto' | 'carro' | 'van';
  capacidade: 'pequena' | 'media' | 'grande';
  is_ativo: boolean;
}

export interface ProfissionalSaude {
  id: string;
  usuario_id: string;
  numero_ordem: string;
  especialidade: string;
  anos_experiencia: number;
  biografia?: string | null;
  atende_domicilio: boolean;
  atende_online: boolean;
  valor_consulta_online?: number;
  valor_consulta_domicilio?: number;
  disponivel: boolean;
}

// ---- Consultas ----
export interface Consulta {
  id: string;
  paciente_id: string;
  medico_id?: string | null;
  hospital_id?: string | null;
  tipo_consulta: TipoConsulta;
  especialidade: string;
  data_hora_agendada: string;
  data_hora_realizada?: string | null;
  duracao_minutos: number;
  status: StatusConsulta;
  sintomas?: string | null;
  diagnostico?: string | null;
  prescricao?: string | null;
  observacoes?: string | null;
  valor: number;
  chat_ativo: boolean;
  created_at: string;
  // Joined fields
  paciente_nome?: string;
  medico_nome?: string;
  hospital_nome?: string;
}

// ---- Medicamentos & Estoque ----
export interface Medicamento {
  id: string;
  nome: string;
  descricao?: string | null;
  preco: number;
  categoria: string;
  necessita_receita: boolean;
  controlado: boolean;
  dosagem?: string | null;
  forma_farmaceutica?: string | null;
  fabricante?: string | null;
  imagem_url?: string | null;
  is_ativo: boolean;
  created_at: string;
}

export interface FarmaciaEstoque {
  id: string;
  farmacia_id: string;
  medicamento_id: string;
  quantidade: number;
  preco_unitario: number;
  preco_venda: number;
  // Joined
  medicamento_nome?: string;
  farmacia_nome?: string;
}

// ---- Pedidos ----
export interface Pedido {
  id: string;
  usuario_id: string;
  farmacia_id?: string | null;
  receita_id?: string | null;
  numero_pedido: string;
  status: StatusPedido;
  total: number;
  subtotal: number;
  taxa_entrega: number;
  desconto: number;
  metodo_pagamento: string;
  endereco_entrega: string;
  zona_entrega?: string | null;
  parcelado: boolean;
  numero_parcelas: number;
  observacoes?: string | null;
  data_entrega_estimada?: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  usuario_nome?: string;
  farmacia_nome?: string;
}

export interface ItemPedido {
  id: string;
  pedido_id: string;
  medicamento_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  medicamento_nome?: string;
}

// ---- Receitas Digitais ----
export interface ReceitaDigital {
  id: string;
  consulta_id: string;
  medico_id: string;
  paciente_id: string;
  codigo_verificacao: string;
  qr_code_url?: string | null;
  status: StatusReceita;
  validade: string;
  observacoes?: string | null;
  created_at: string;
  // Joined
  medico_nome?: string;
  paciente_nome?: string;
  itens?: ItemReceita[];
}

export interface ItemReceita {
  id: string;
  receita_id: string;
  medicamento_id?: string | null;
  nome_medicamento: string;
  dosagem: string;
  frequencia: string;
  duracao: string;
  quantidade: number;
  instrucoes?: string | null;
}

// ---- Entregas ----
export interface Entrega {
  id: string;
  pedido_id: string;
  motorista_id?: string | null;
  veiculo_id?: string | null;
  empresa_transporte_id?: string | null;
  status: StatusEntrega;
  latitude_atual?: number | null;
  longitude_atual?: number | null;
  endereco_coleta: string;
  endereco_entrega: string;
  distancia_km?: number | null;
  tempo_estimado_minutos?: number | null;
  data_coleta?: string | null;
  data_entrega?: string | null;
  codigo_confirmacao?: string | null;
  created_at: string;
}

// ---- Rodízio ----
export interface FilaRodizio {
  id: string;
  pedido_id: string;
  farmacia_id: string;
  posicao_fila: number;
  status: 'aguardando' | 'notificada' | 'aceite' | 'recusada' | 'expirada';
  notificada_em?: string | null;
  respondida_em?: string | null;
  motivo_recusa?: string | null;
}

// ---- Notificações ----
export interface Notificacao {
  id: string;
  usuario_id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  referencia_id?: string | null;
  referencia_tipo?: string | null;
  lida: boolean;
  created_at: string;
}

// ---- Pacotes & Assinaturas ----
export interface PacoteSaude {
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  preco_mensal: number;
  duracao_meses: number;
  beneficios: Json;
  limite_consultas?: number | null;
  desconto_medicamentos: number;
  is_ativo: boolean;
  created_at: string;
}

export interface AssinaturaPacote {
  id: string;
  usuario_id: string;
  pacote_id: string;
  data_inicio: string;
  data_fim: string;
  status: 'ativa' | 'cancelada' | 'expirada' | 'suspensa';
  valor_pago?: number;
  metodo_pagamento?: string;
  pacote_nome?: string;
  pacote_descricao?: string;
  preco_mensal?: number;
}

// ---- Chat ----
export interface MensagemChat {
  id: string;
  consulta_id: string;
  remetente_id: string;
  mensagem: string;
  tipo: 'texto' | 'arquivo' | 'sistema';
  arquivo_url?: string | null;
  arquivo_nome?: string | null;
  lida: boolean;
  created_at: string;
  // Joined
  nome_completo?: string;
  foto_perfil?: string | null;
  tipo_usuario?: TipoUsuario;
}

// ---- Auth Response ----
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    nome_completo: string;
    email: string;
    telefone: string;
    tipo_usuario: TipoUsuario;
    status_conta: StatusConta;
    entidade_id?: string | null;
    entidade_tipo?: TipoEntidade | null;
    foto_perfil?: string | null;
  };
}

// ---- Admin Stats ----
export interface AdminStats {
  total_usuarios: number;
  usuarios_ativos: number;
  total_consultas: number;
  consultas_hoje: number;
  total_pedidos: number;
  receita_total: number;
  total_farmacias: number;
  total_hospitais: number;
  pendentes_aprovacao: number;
}

// ---- Medico Stats ----
export interface MedicoStats {
  consultas_hoje: number;
  consultas_semana: number;
  pacientes_total: number;
  proxima_consulta: Consulta | null;
  avaliacoes_media: string;
  total_avaliacoes: number;
  receita_mes: number;
}

