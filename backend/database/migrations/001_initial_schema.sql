-- ============================================
-- FarmaDom — Schema PostgreSQL Principal
-- Migração 001: Schema Completo Multi-Entidade
-- ============================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE tipo_usuario_enum AS ENUM (
  'paciente',
  'medico',
  'farmacia_admin',
  'farmacia_funcionario',
  'hospital_gerente',
  'transporte_gerente',
  'motorista',
  'admin'
);

CREATE TYPE status_conta_enum AS ENUM (
  'pendente_aprovacao',
  'ativo',
  'suspenso',
  'inativo'
);

CREATE TYPE tipo_consulta_enum AS ENUM (
  'presencial',
  'video',
  'audio',
  'chat'
);

CREATE TYPE status_consulta_enum AS ENUM (
  'agendada',
  'confirmada',
  'em_andamento',
  'concluida',
  'cancelada'
);

CREATE TYPE status_pedido_enum AS ENUM (
  'pendente',
  'aguardando_farmacia',
  'aceito',
  'preparando',
  'aguardando_transporte',
  'em_transito',
  'entregue',
  'cancelado'
);

CREATE TYPE status_rodizio_enum AS ENUM (
  'pendente',
  'enviado',
  'aceito',
  'recusado',
  'expirado'
);

CREATE TYPE status_entrega_enum AS ENUM (
  'aguardando',
  'aceita',
  'recolhido',
  'em_transito',
  'entregue',
  'cancelado'
);

CREATE TYPE status_receita_enum AS ENUM (
  'ativa',
  'usada',
  'expirada',
  'cancelada'
);

CREATE TYPE status_assinatura_enum AS ENUM (
  'ativa',
  'suspensa',
  'cancelada',
  'expirada'
);

CREATE TYPE status_pagamento_enum AS ENUM (
  'pendente',
  'aprovado',
  'recusado',
  'reembolsado'
);

CREATE TYPE status_parcela_enum AS ENUM (
  'pendente',
  'paga',
  'atrasada',
  'cancelada'
);

CREATE TYPE tipo_notificacao_enum AS ENUM (
  'pedido',
  'consulta',
  'entrega',
  'pagamento',
  'receita',
  'sistema',
  'aprovacao'
);

CREATE TYPE tipo_mensagem_enum AS ENUM (
  'texto',
  'arquivo',
  'imagem',
  'sistema'
);

-- ============================================
-- TABELA: usuarios (base para todos os perfis)
-- ============================================

CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  nome_completo VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  data_nascimento DATE,
  genero VARCHAR(20),
  nif VARCHAR(50),
  tipo_usuario tipo_usuario_enum NOT NULL DEFAULT 'paciente',
  status_conta status_conta_enum NOT NULL DEFAULT 'ativo',
  foto_perfil TEXT,
  endereco_completo TEXT,
  cidade VARCHAR(100),
  provincia VARCHAR(100),
  is_ativo BOOLEAN DEFAULT TRUE,
  email_verificado BOOLEAN DEFAULT FALSE,
  telefone_verificado BOOLEAN DEFAULT FALSE,
  entidade_id UUID, -- referência polimórfica: farmacia_id, hospital_id, empresa_transporte_id
  entidade_tipo VARCHAR(50), -- 'farmacia', 'hospital', 'empresa_transporte'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX idx_usuarios_entidade ON usuarios(entidade_id, entidade_tipo);

-- ============================================
-- TABELA: hospitais
-- ============================================

CREATE TABLE hospitais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  endereco TEXT,
  cidade VARCHAR(100),
  provincia VARCHAR(100),
  telefone VARCHAR(20),
  email VARCHAR(255),
  logo_url TEXT,
  licenca VARCHAR(100),
  percentual_hospital DECIMAL(5,2) DEFAULT 30.00, -- % que o hospital recebe
  is_ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABELA: farmacias
-- ============================================

CREATE TABLE farmacias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  endereco TEXT,
  cidade VARCHAR(100),
  provincia VARCHAR(100),
  zona VARCHAR(100), -- zona de cobertura para rodízio
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  telefone VARCHAR(20),
  email VARCHAR(255),
  logo_url TEXT,
  licenca VARCHAR(100),
  horario_funcionamento JSONB, -- {"seg": {"abre": "08:00", "fecha": "18:00"}, ...}
  aceita_parcelamento BOOLEAN DEFAULT FALSE,
  is_online BOOLEAN DEFAULT FALSE, -- farmácia está online/ativa no momento
  is_ativa BOOLEAN DEFAULT TRUE,
  penalidade_rodizio INT DEFAULT 0, -- penalidade por recusas (reduz prioridade)
  ultimo_pedido_recebido TIMESTAMP, -- para round-robin
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_farmacias_zona ON farmacias(zona);
CREATE INDEX idx_farmacias_online ON farmacias(is_online, is_ativa);

-- ============================================
-- TABELA: empresas_transporte
-- ============================================

CREATE TABLE empresas_transporte (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(50),
  telefone VARCHAR(20),
  email VARCHAR(255),
  logo_url TEXT,
  comissao_farmdom DECIMAL(5,2) DEFAULT 10.00, -- % comissão FarmaDom
  is_ativa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABELA: veiculos
-- ============================================

CREATE TABLE veiculos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_transporte_id UUID NOT NULL REFERENCES empresas_transporte(id),
  placa VARCHAR(20),
  modelo VARCHAR(100),
  motorista_id UUID REFERENCES usuarios(id),
  is_ativo BOOLEAN DEFAULT TRUE,
  is_disponivel BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_veiculos_empresa ON veiculos(empresa_transporte_id);
CREATE INDEX idx_veiculos_motorista ON veiculos(motorista_id);

-- ============================================
-- TABELA: medicos_hospitais (N:N)
-- ============================================

CREATE TABLE medicos_hospitais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medico_id UUID NOT NULL REFERENCES usuarios(id),
  hospital_id UUID NOT NULL REFERENCES hospitais(id),
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_fim DATE,
  is_ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(medico_id, hospital_id)
);

CREATE INDEX idx_medicos_hospitais_medico ON medicos_hospitais(medico_id);
CREATE INDEX idx_medicos_hospitais_hospital ON medicos_hospitais(hospital_id);

-- ============================================
-- TABELA: profissionais_saude (perfil médico)
-- ============================================

CREATE TABLE profissionais_saude (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID UNIQUE NOT NULL REFERENCES usuarios(id),
  numero_ordem VARCHAR(50), -- cédula profissional
  especialidade VARCHAR(100),
  anos_experiencia INT DEFAULT 0,
  biografia TEXT,
  atende_domicilio BOOLEAN DEFAULT FALSE,
  atende_online BOOLEAN DEFAULT TRUE,
  valor_consulta_online DECIMAL(10,2) DEFAULT 0,
  valor_consulta_presencial DECIMAL(10,2) DEFAULT 0,
  valor_consulta_domicilio DECIMAL(10,2) DEFAULT 0,
  disponivel BOOLEAN DEFAULT TRUE,
  -- Documentos para validação
  documento_identidade_url TEXT,
  diploma_url TEXT,
  cedula_profissional_url TEXT,
  documentos_validados BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_profissionais_usuario ON profissionais_saude(usuario_id);
CREATE INDEX idx_profissionais_especialidade ON profissionais_saude(especialidade);

-- ============================================
-- TABELA: consultas
-- ============================================

CREATE TABLE consultas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES usuarios(id),
  medico_id UUID REFERENCES usuarios(id),
  hospital_id UUID REFERENCES hospitais(id), -- hospital onde ocorre
  tipo_consulta tipo_consulta_enum NOT NULL DEFAULT 'chat',
  especialidade VARCHAR(100),
  data_hora_agendada TIMESTAMP NOT NULL,
  data_hora_realizada TIMESTAMP,
  duracao_minutos INT,
  status status_consulta_enum DEFAULT 'agendada',
  sintomas TEXT,
  diagnostico TEXT,
  prescricao TEXT,
  observacoes TEXT,
  valor DECIMAL(10,2) DEFAULT 0,
  -- Chat/Video
  chat_ativo BOOLEAN DEFAULT FALSE,
  chat_iniciado_em TIMESTAMP,
  video_ativo BOOLEAN DEFAULT FALSE,
  video_iniciado_em TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_consultas_paciente ON consultas(paciente_id);
CREATE INDEX idx_consultas_medico ON consultas(medico_id);
CREATE INDEX idx_consultas_hospital ON consultas(hospital_id);
CREATE INDEX idx_consultas_status ON consultas(status);
CREATE INDEX idx_consultas_data ON consultas(data_hora_agendada);

-- ============================================
-- TABELA: medicamentos
-- ============================================

CREATE TABLE medicamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  principio_ativo VARCHAR(255),
  fabricante VARCHAR(255),
  categoria VARCHAR(100),
  preco DECIMAL(10,2) NOT NULL DEFAULT 0,
  prescricao_necessaria BOOLEAN DEFAULT FALSE,
  controlado BOOLEAN DEFAULT FALSE, -- medicamento controlado exige receita digital
  descricao TEXT,
  posologia TEXT,
  contraindicacoes TEXT,
  imagem_url TEXT,
  is_ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_medicamentos_categoria ON medicamentos(categoria);
CREATE INDEX idx_medicamentos_nome ON medicamentos(nome);

-- ============================================
-- TABELA: farmacia_estoque (estoque por farmácia)
-- ============================================

CREATE TABLE farmacia_estoque (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmacia_id UUID NOT NULL REFERENCES farmacias(id),
  medicamento_id UUID NOT NULL REFERENCES medicamentos(id),
  quantidade INT DEFAULT 0,
  preco_farmacia DECIMAL(10,2), -- preço específico da farmácia (ou NULL = preço padrão)
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(farmacia_id, medicamento_id)
);

CREATE INDEX idx_estoque_farmacia ON farmacia_estoque(farmacia_id);
CREATE INDEX idx_estoque_medicamento ON farmacia_estoque(medicamento_id);

-- ============================================
-- TABELA: pedidos
-- ============================================

CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  farmacia_id UUID REFERENCES farmacias(id), -- atribuída pelo rodízio
  numero_pedido VARCHAR(50) UNIQUE NOT NULL,
  status status_pedido_enum DEFAULT 'pendente',
  total DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) DEFAULT 0,
  taxa_entrega DECIMAL(10,2) DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  metodo_pagamento VARCHAR(50) DEFAULT 'a_definir',
  endereco_entrega TEXT,
  latitude_entrega DECIMAL(10,8),
  longitude_entrega DECIMAL(11,8),
  zona_entrega VARCHAR(100), -- zona para rodízio
  observacoes TEXT,
  receita_id UUID, -- receita digital se medicamento controlado
  parcelado BOOLEAN DEFAULT FALSE,
  numero_parcelas INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_farmacia ON pedidos(farmacia_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_zona ON pedidos(zona_entrega);

-- ============================================
-- TABELA: itens_pedido
-- ============================================

CREATE TABLE itens_pedido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  medicamento_id UUID NOT NULL REFERENCES medicamentos(id),
  quantidade INT NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_itens_pedido ON itens_pedido(pedido_id);

-- ============================================
-- TABELA: fila_rodizio (distribuição inteligente)
-- ============================================

CREATE TABLE fila_rodizio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id),
  farmacia_id UUID NOT NULL REFERENCES farmacias(id),
  posicao INT NOT NULL, -- posição na fila (1, 2, 3...)
  status status_rodizio_enum DEFAULT 'pendente',
  enviado_em TIMESTAMP,
  respondido_em TIMESTAMP,
  motivo_recusa TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rodizio_pedido ON fila_rodizio(pedido_id);
CREATE INDEX idx_rodizio_farmacia ON fila_rodizio(farmacia_id);
CREATE INDEX idx_rodizio_status ON fila_rodizio(status);

-- ============================================
-- TABELA: rodizio_config (configurações do rodízio)
-- ============================================

CREATE TABLE rodizio_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zona VARCHAR(100) DEFAULT 'default',
  tempo_resposta_minutos INT DEFAULT 5,
  max_tentativas INT DEFAULT 5,
  penalidade_recusa INT DEFAULT 1, -- pontos de penalidade por recusa
  penalidade_timeout INT DEFAULT 2, -- pontos de penalidade por timeout
  is_ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABELA: receitas_digitais
-- ============================================

CREATE TABLE receitas_digitais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consulta_id UUID REFERENCES consultas(id),
  medico_id UUID NOT NULL REFERENCES usuarios(id),
  paciente_id UUID NOT NULL REFERENCES usuarios(id),
  codigo_verificacao UUID UNIQUE DEFAULT uuid_generate_v4(),
  qr_code_hash VARCHAR(64), -- SHA-256 hash para QR
  assinatura_digital TEXT,
  validade TIMESTAMP NOT NULL,
  status status_receita_enum DEFAULT 'ativa',
  farmacia_dispensou_id UUID REFERENCES farmacias(id),
  dispensado_em TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_receitas_medico ON receitas_digitais(medico_id);
CREATE INDEX idx_receitas_paciente ON receitas_digitais(paciente_id);
CREATE INDEX idx_receitas_codigo ON receitas_digitais(codigo_verificacao);
CREATE INDEX idx_receitas_status ON receitas_digitais(status);

-- ============================================
-- TABELA: itens_receita
-- ============================================

CREATE TABLE itens_receita (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receita_id UUID NOT NULL REFERENCES receitas_digitais(id) ON DELETE CASCADE,
  medicamento_id UUID NOT NULL REFERENCES medicamentos(id),
  quantidade INT NOT NULL DEFAULT 1,
  dosagem VARCHAR(255),
  instrucoes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_itens_receita ON itens_receita(receita_id);

-- ============================================
-- TABELA: entregas
-- ============================================

CREATE TABLE entregas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id),
  farmacia_id UUID NOT NULL REFERENCES farmacias(id),
  empresa_transporte_id UUID REFERENCES empresas_transporte(id),
  veiculo_id UUID REFERENCES veiculos(id),
  motorista_id UUID REFERENCES usuarios(id),
  status status_entrega_enum DEFAULT 'aguardando',
  latitude_atual DECIMAL(10,8),
  longitude_atual DECIMAL(11,8),
  latitude_destino DECIMAL(10,8),
  longitude_destino DECIMAL(11,8),
  distancia_km DECIMAL(8,2),
  valor_entrega DECIMAL(10,2) DEFAULT 0,
  foto_comprovante TEXT,
  observacoes TEXT,
  aceita_em TIMESTAMP,
  recolhido_em TIMESTAMP,
  entregue_em TIMESTAMP,
  cancelado_em TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_entregas_pedido ON entregas(pedido_id);
CREATE INDEX idx_entregas_motorista ON entregas(motorista_id);
CREATE INDEX idx_entregas_farmacia ON entregas(farmacia_id);
CREATE INDEX idx_entregas_status ON entregas(status);

-- ============================================
-- TABELA: pacotes_saude
-- ============================================

CREATE TABLE pacotes_saude (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50),
  preco_mensal DECIMAL(10,2) NOT NULL,
  duracao_meses INT DEFAULT 1,
  beneficios JSONB,
  limite_consultas INT,
  desconto_medicamentos DECIMAL(5,2) DEFAULT 0,
  is_ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABELA: assinaturas_pacotes
-- ============================================

CREATE TABLE assinaturas_pacotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  pacote_id UUID NOT NULL REFERENCES pacotes_saude(id),
  data_inicio TIMESTAMP NOT NULL DEFAULT NOW(),
  data_fim TIMESTAMP,
  status status_assinatura_enum DEFAULT 'ativa',
  valor_pago DECIMAL(10,2),
  metodo_pagamento VARCHAR(50),
  proxima_cobranca TIMESTAMP,
  cancelado_em TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assinaturas_usuario ON assinaturas_pacotes(usuario_id);
CREATE INDEX idx_assinaturas_status ON assinaturas_pacotes(status);

-- ============================================
-- TABELA: pagamentos_assinaturas
-- ============================================

CREATE TABLE pagamentos_assinaturas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assinatura_id UUID REFERENCES assinaturas_pacotes(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  pacote_id UUID REFERENCES pacotes_saude(id),
  valor DECIMAL(10,2) NOT NULL,
  metodo_pagamento VARCHAR(50),
  status status_pagamento_enum DEFAULT 'pendente',
  referencia_pagamento VARCHAR(100),
  data_pagamento TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pagamentos_usuario ON pagamentos_assinaturas(usuario_id);

-- ============================================
-- TABELA: parcelas (parcelamento de pedidos)
-- ============================================

CREATE TABLE parcelas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  farmacia_id UUID REFERENCES farmacias(id),
  numero_parcela INT NOT NULL,
  total_parcelas INT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status status_parcela_enum DEFAULT 'pendente',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_parcelas_pedido ON parcelas(pedido_id);
CREATE INDEX idx_parcelas_usuario ON parcelas(usuario_id);
CREATE INDEX idx_parcelas_status ON parcelas(status);

-- ============================================
-- TABELA: avaliacoes_consultas
-- ============================================

CREATE TABLE avaliacoes_consultas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consulta_id UUID UNIQUE NOT NULL REFERENCES consultas(id),
  nota INT CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABELA: mensagens_chat
-- ============================================

CREATE TABLE mensagens_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consulta_id UUID NOT NULL REFERENCES consultas(id),
  remetente_id UUID NOT NULL REFERENCES usuarios(id),
  mensagem TEXT,
  tipo tipo_mensagem_enum DEFAULT 'texto',
  arquivo_url TEXT,
  arquivo_nome VARCHAR(255),
  lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mensagens_consulta ON mensagens_chat(consulta_id);
CREATE INDEX idx_mensagens_remetente ON mensagens_chat(remetente_id);

-- ============================================
-- TABELA: usuarios_online (presença)
-- ============================================

CREATE TABLE usuarios_online (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID UNIQUE NOT NULL REFERENCES usuarios(id),
  socket_id VARCHAR(100),
  consulta_id UUID REFERENCES consultas(id),
  ultima_atividade TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABELA: consultas_signals (WebRTC sinais)
-- ============================================

CREATE TABLE consultas_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consulta_id UUID NOT NULL REFERENCES consultas(id),
  user_id UUID NOT NULL REFERENCES usuarios(id),
  signal_type VARCHAR(50),
  signal_data TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_signals_consulta ON consultas_signals(consulta_id);

-- ============================================
-- TABELA: rastreamento_pedidos
-- ============================================

CREATE TABLE rastreamento_pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id),
  status VARCHAR(50),
  descricao TEXT,
  localizacao TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rastreamento_pedido ON rastreamento_pedidos(pedido_id);

-- ============================================
-- TABELA: notificacoes
-- ============================================

CREATE TABLE notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  tipo tipo_notificacao_enum DEFAULT 'sistema',
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT,
  dados JSONB, -- dados extras (pedido_id, consulta_id, etc.)
  lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(usuario_id, lida);

-- ============================================
-- TABELA: logs_auditoria
-- ============================================

CREATE TABLE logs_auditoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id),
  entidade_tipo VARCHAR(50), -- 'usuario', 'pedido', 'consulta', etc.
  entidade_id UUID,
  acao VARCHAR(50), -- 'criar', 'atualizar', 'deletar', 'login', etc.
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_logs_usuario ON logs_auditoria(usuario_id);
CREATE INDEX idx_logs_entidade ON logs_auditoria(entidade_tipo, entidade_id);
CREATE INDEX idx_logs_data ON logs_auditoria(created_at);

-- ============================================
-- TABELA: comissoes_config (configuração de comissões)
-- ============================================

CREATE TABLE comissoes_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entidade_tipo VARCHAR(50) NOT NULL, -- 'farmacia', 'hospital', 'transporte', 'medico'
  percentual_farmdom DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  percentual_entidade DECIMAL(5,2) NOT NULL DEFAULT 95.00,
  descricao TEXT,
  is_ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABELA: _migrations (controle de migrações)
-- ============================================

CREATE TABLE _migrations (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) UNIQUE NOT NULL,
  aplicada_em TIMESTAMP DEFAULT NOW()
);

-- Registrar esta migração
INSERT INTO _migrations (nome) VALUES ('001_initial_schema');

-- ============================================
-- CONFIGURAÇÃO INICIAL: Rodízio padrão
-- ============================================

INSERT INTO rodizio_config (zona, tempo_resposta_minutos, max_tentativas) 
VALUES ('default', 5, 5);

-- ============================================
-- CONFIGURAÇÃO INICIAL: Comissões padrão
-- ============================================

INSERT INTO comissoes_config (entidade_tipo, percentual_farmdom, percentual_entidade, descricao) VALUES
  ('farmacia', 5.00, 95.00, 'Comissão padrão para farmácias'),
  ('hospital', 10.00, 90.00, 'Comissão padrão para hospitais'),
  ('transporte', 10.00, 90.00, 'Comissão padrão para transporte'),
  ('medico', 15.00, 85.00, 'Comissão padrão para médicos');
