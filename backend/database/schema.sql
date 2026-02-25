-- =============================================
-- SCHEMA DO BANCO DE DADOS - FarmaDom
-- Sistema de Saúde Domiciliar
-- =============================================

-- =============================================
-- TABELAS DE USUÁRIOS E AUTENTICAÇÃO
-- =============================================

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    nif VARCHAR(20) UNIQUE,
    data_nascimento DATE,
    genero VARCHAR(20),
    tipo_usuario VARCHAR(50) NOT NULL, -- 'paciente', 'medico', 'enfermeiro', 'admin', 'farmaceutico'
    foto_perfil TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    verificado BOOLEAN DEFAULT FALSE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE enderecos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) DEFAULT 'residencial', -- 'residencial', 'comercial', 'temporario'
    provincia VARCHAR(100) NOT NULL,
    municipio VARCHAR(100) NOT NULL,
    bairro VARCHAR(100),
    rua VARCHAR(255),
    numero VARCHAR(20),
    complemento TEXT,
    ponto_referencia TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    principal BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELAS DE CADASTRO MÉDICO DIGITAL
-- =============================================

CREATE TABLE historico_medico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_sanguineo VARCHAR(10),
    peso DECIMAL(5, 2),
    altura DECIMAL(5, 2),
    doador_orgaos BOOLEAN DEFAULT FALSE,
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alergias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    historico_medico_id UUID REFERENCES historico_medico(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'medicamento', 'alimento', 'substancia'
    nome VARCHAR(255) NOT NULL,
    gravidade VARCHAR(50), -- 'leve', 'moderada', 'grave', 'muito_grave'
    sintomas TEXT,
    data_diagnostico DATE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doencas_cronicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    historico_medico_id UUID REFERENCES historico_medico(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    codigo_cid VARCHAR(20),
    data_diagnostico DATE,
    em_tratamento BOOLEAN DEFAULT TRUE,
    controlada BOOLEAN DEFAULT FALSE,
    observacoes TEXT,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medicamentos_uso_continuo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    historico_medico_id UUID REFERENCES historico_medico(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    dosagem VARCHAR(100),
    frequencia VARCHAR(100),
    horarios JSONB, -- Array de horários: ["08:00", "14:00", "20:00"]
    inicio_uso DATE,
    previsao_termino DATE,
    motivo TEXT,
    alertas_ativos BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE historico_cirurgias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    historico_medico_id UUID REFERENCES historico_medico(id) ON DELETE CASCADE,
    tipo_cirurgia VARCHAR(255) NOT NULL,
    data_cirurgia DATE NOT NULL,
    hospital VARCHAR(255),
    medico_responsavel VARCHAR(255),
    complicacoes TEXT,
    observacoes TEXT,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELAS DE ESPECIALIDADES E PROFISSIONAIS
-- =============================================

CREATE TABLE especialidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) UNIQUE NOT NULL,
    descricao TEXT,
    icone VARCHAR(100),
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profissionais_saude (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    numero_ordem VARCHAR(50) UNIQUE, -- Número da ordem dos médicos
    especialidade_id UUID REFERENCES especialidades(id),
    anos_experiencia INTEGER,
    biografia TEXT,
    atende_domicilio BOOLEAN DEFAULT TRUE,
    atende_online BOOLEAN DEFAULT TRUE,
    valor_consulta_online DECIMAL(10, 2),
    valor_consulta_domicilio DECIMAL(10, 2),
    disponivel BOOLEAN DEFAULT TRUE,
    avaliacao_media DECIMAL(3, 2) DEFAULT 0.00,
    total_avaliacoes INTEGER DEFAULT 0,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE horarios_atendimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profissional_id UUID REFERENCES profissionais_saude(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL, -- 0=Domingo, 1=Segunda, ..., 6=Sábado
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    duracao_consulta INTEGER DEFAULT 30, -- em minutos
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELAS DE CONSULTAS E AGENDAMENTOS
-- =============================================

CREATE TABLE consultas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    profissional_id UUID REFERENCES profissionais_saude(id),
    especialidade_id UUID REFERENCES especialidades(id),
    tipo_atendimento VARCHAR(50) NOT NULL, -- 'online', 'domicilio'
    data_hora TIMESTAMP NOT NULL,
    duracao INTEGER DEFAULT 30, -- em minutos
    status VARCHAR(50) DEFAULT 'agendada', -- 'agendada', 'confirmada', 'em_andamento', 'concluida', 'cancelada', 'nao_compareceu'
    motivo_consulta TEXT,
    diagnostico TEXT,
    prescricoes TEXT,
    observacoes TEXT,
    endereco_atendimento_id UUID REFERENCES enderecos(id),
    link_videochamada TEXT,
    valor DECIMAL(10, 2),
    pago BOOLEAN DEFAULT FALSE,
    avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
    comentario_avaliacao TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para armazenar sinais WebRTC (sinalização de videochamadas)
CREATE TABLE consultas_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consulta_id UUID REFERENCES consultas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    signal_type VARCHAR(50) NOT NULL, -- 'offer', 'answer', 'candidate'
    signal_data TEXT NOT NULL, -- JSON com os dados do sinal
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_consulta_user (consulta_id, user_id),
    INDEX idx_created_at (created_at)
);

CREATE TABLE receitas_medicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consulta_id UUID REFERENCES consultas(id) ON DELETE CASCADE,
    paciente_id UUID REFERENCES usuarios(id),
    profissional_id UUID REFERENCES profissionais_saude(id),
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    validade_dias INTEGER DEFAULT 90,
    observacoes TEXT,
    assinatura_digital TEXT,
    qr_code TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE itens_receita (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receita_id UUID REFERENCES receitas_medicas(id) ON DELETE CASCADE,
    medicamento_nome VARCHAR(255) NOT NULL,
    dosagem VARCHAR(100),
    quantidade INTEGER,
    posologia TEXT, -- "Tomar 1 comprimido a cada 8 horas"
    duracao_tratamento VARCHAR(100),
    observacoes TEXT
);

-- =============================================
-- TABELAS DE MEDICAMENTOS E FARMÁCIA
-- =============================================

CREATE TABLE categorias_medicamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) UNIQUE NOT NULL,
    descricao TEXT,
    icone VARCHAR(100),
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medicamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    nome_generico VARCHAR(255),
    categoria_id UUID REFERENCES categorias_medicamentos(id),
    fabricante VARCHAR(255),
    descricao TEXT,
    composicao TEXT,
    apresentacao VARCHAR(100), -- "Caixa com 30 comprimidos"
    requer_receita BOOLEAN DEFAULT FALSE,
    controlado BOOLEAN DEFAULT FALSE,
    preco DECIMAL(10, 2) NOT NULL,
    preco_promocional DECIMAL(10, 2),
    estoque INTEGER DEFAULT 0,
    estoque_minimo INTEGER DEFAULT 10,
    codigo_barras VARCHAR(50) UNIQUE,
    imagem TEXT,
    bula TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE farmacias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco_id UUID REFERENCES enderecos(id),
    horario_funcionamento JSONB, -- {"seg-sex": "08:00-20:00", "sab": "08:00-14:00"}
    entrega_disponivel BOOLEAN DEFAULT TRUE,
    raio_entrega_km DECIMAL(5, 2) DEFAULT 10.00,
    tempo_entrega_estimado INTEGER DEFAULT 60, -- em minutos
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE estoque_farmacia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmacia_id UUID REFERENCES farmacias(id) ON DELETE CASCADE,
    medicamento_id UUID REFERENCES medicamentos(id) ON DELETE CASCADE,
    quantidade INTEGER DEFAULT 0,
    lote VARCHAR(50),
    data_validade DATE,
    preco DECIMAL(10, 2),
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(farmacia_id, medicamento_id, lote)
);

-- =============================================
-- TABELAS DE PEDIDOS E ENTREGAS
-- =============================================

CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    paciente_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    farmacia_id UUID REFERENCES farmacias(id),
    endereco_entrega_id UUID REFERENCES enderecos(id),
    tipo_entrega VARCHAR(50) DEFAULT 'rapida', -- 'rapida', 'agendada'
    data_hora_entrega TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'confirmado', 'preparando', 'em_rota', 'entregue', 'cancelado'
    subtotal DECIMAL(10, 2) NOT NULL,
    taxa_entrega DECIMAL(10, 2) DEFAULT 0.00,
    desconto DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL,
    forma_pagamento VARCHAR(50), -- 'cartao', 'multicaixa', 'mobile_banking', 'parcelado'
    parcelas INTEGER DEFAULT 1,
    pago BOOLEAN DEFAULT FALSE,
    receita_id UUID REFERENCES receitas_medicas(id),
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE itens_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    medicamento_id UUID REFERENCES medicamentos(id),
    quantidade INTEGER NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);

CREATE TABLE entregas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    entregador_id UUID REFERENCES usuarios(id),
    status VARCHAR(50) DEFAULT 'aguardando', -- 'aguardando', 'em_rota', 'entregue', 'cancelado', 'falhou'
    data_saida TIMESTAMP,
    data_entrega TIMESTAMP,
    localizacao_atual JSONB, -- {"lat": -8.8383, "lng": 13.2344}
    codigo_rastreamento VARCHAR(50) UNIQUE,
    foto_comprovante TEXT,
    assinatura_cliente TEXT,
    avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
    comentario TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELAS DE PACOTES E PLANOS DE SAÚDE
-- =============================================

CREATE TABLE pacotes_saude (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(100) NOT NULL, -- 'mental', 'materno_infantil', 'cronicas', 'paliativo', 'fisioterapia'
    descricao TEXT,
    duracao_meses INTEGER,
    numero_consultas INTEGER,
    servicos_inclusos JSONB, -- ["Consultas", "Medicamentos", "Exames", "Monitoramento"]
    valor_total DECIMAL(10, 2) NOT NULL,
    parcelas_max INTEGER DEFAULT 6,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE etapas_pacote (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pacote_id UUID REFERENCES pacotes_saude(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    nome VARCHAR(255) NOT NULL, -- 'Diagnóstico', 'Tratamento', 'Monitoramento'
    descricao TEXT,
    duracao_dias INTEGER,
    atividades JSONB -- ["Consulta inicial", "Exames laboratoriais", "Prescrição"]
);

CREATE TABLE assinaturas_pacotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    pacote_id UUID REFERENCES pacotes_saude(id),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    status VARCHAR(50) DEFAULT 'ativo', -- 'ativo', 'pausado', 'concluido', 'cancelado'
    valor_total DECIMAL(10, 2) NOT NULL,
    parcelas INTEGER DEFAULT 1,
    parcela_atual INTEGER DEFAULT 1,
    valor_parcela DECIMAL(10, 2) NOT NULL,
    data_proxima_parcela DATE,
    etapa_atual UUID REFERENCES etapas_pacote(id),
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELAS DE PAGAMENTOS E FINANCEIRO
-- =============================================

CREATE TABLE pagamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referencia VARCHAR(100) UNIQUE NOT NULL,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'consulta', 'pedido', 'assinatura', 'parcela'
    entidade_id UUID, -- ID da consulta, pedido ou assinatura
    valor DECIMAL(10, 2) NOT NULL,
    metodo_pagamento VARCHAR(50), -- 'cartao', 'multicaixa', 'mobile_banking', 'transferencia'
    status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'processando', 'aprovado', 'recusado', 'cancelado', 'reembolsado'
    data_vencimento DATE,
    data_pagamento TIMESTAMP,
    comprovante TEXT,
    descricao TEXT,
    metadata JSONB, -- Informações adicionais do gateway de pagamento
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parcelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assinatura_id UUID REFERENCES assinaturas_pacotes(id) ON DELETE CASCADE,
    numero_parcela INTEGER NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    pagamento_id UUID REFERENCES pagamentos(id),
    status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'pago', 'atrasado', 'cancelado'
    dias_atraso INTEGER DEFAULT 0,
    data_pagamento DATE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELAS DE MONITORAMENTO E DISPOSITIVOS
-- =============================================

CREATE TABLE dispositivos_saude (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(100) NOT NULL, -- 'glicosimetro', 'pressao', 'oximetro', 'balanca', 'termometro'
    marca VARCHAR(100),
    modelo VARCHAR(100),
    identificador_unico VARCHAR(255) UNIQUE,
    conectado BOOLEAN DEFAULT FALSE,
    ultima_sincronia TIMESTAMP,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medicoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispositivo_id UUID REFERENCES dispositivos_saude(id) ON DELETE CASCADE,
    paciente_id UUID REFERENCES usuarios(id),
    tipo_medicao VARCHAR(50) NOT NULL, -- 'glicose', 'pressao_arterial', 'saturacao', 'peso', 'temperatura'
    valores JSONB NOT NULL, -- {"sistolica": 120, "diastolica": 80} ou {"glicose": 95}
    unidade VARCHAR(20), -- 'mg/dL', 'mmHg', 'kg', '°C', '%'
    dentro_limite BOOLEAN DEFAULT TRUE,
    alerta_gerado BOOLEAN DEFAULT FALSE,
    observacoes TEXT,
    data_medicao TIMESTAMP NOT NULL,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alertas_saude (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    medicao_id UUID REFERENCES medicoes(id),
    tipo VARCHAR(50) NOT NULL, -- 'medicamento', 'medicao', 'consulta', 'exame'
    gravidade VARCHAR(50) DEFAULT 'baixa', -- 'baixa', 'media', 'alta', 'critica'
    mensagem TEXT NOT NULL,
    lido BOOLEAN DEFAULT FALSE,
    acao_tomada TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_leitura TIMESTAMP
);

-- =============================================
-- TABELAS DE NOTIFICAÇÕES
-- =============================================

CREATE TABLE notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'alerta', 'lembrete', 'atualizacao', 'promocao'
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    link TEXT,
    icon VARCHAR(100),
    lida BOOLEAN DEFAULT FALSE,
    enviada_push BOOLEAN DEFAULT FALSE,
    enviada_email BOOLEAN DEFAULT FALSE,
    enviada_sms BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_leitura TIMESTAMP
);

-- =============================================
-- TABELAS DE CONTRATOS E SEGUROS
-- =============================================

CREATE TABLE contratos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    assinatura_id UUID REFERENCES assinaturas_pacotes(id),
    tipo VARCHAR(50) NOT NULL, -- 'termo_uso', 'contrato_plano', 'consentimento'
    conteudo TEXT NOT NULL,
    versao VARCHAR(20),
    aceito BOOLEAN DEFAULT FALSE,
    ip_aceite VARCHAR(50),
    data_aceite TIMESTAMP,
    fiador_nome VARCHAR(255),
    fiador_nif VARCHAR(20),
    fiador_telefone VARCHAR(20),
    garantia_tipo VARCHAR(50), -- 'cartao', 'caucao', 'fiador'
    garantia_dados JSONB,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seguros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    seguradora VARCHAR(255),
    cobertura JSONB, -- {"morte": true, "invalidez": true, "perda_renda": false}
    valor_mensal DECIMAL(10, 2) NOT NULL,
    vigencia_meses INTEGER DEFAULT 12,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE apolices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_apolice VARCHAR(100) UNIQUE NOT NULL,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    assinatura_id UUID REFERENCES assinaturas_pacotes(id),
    seguro_id UUID REFERENCES seguros(id),
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'ativa', -- 'ativa', 'cancelada', 'expirada', 'sinistro'
    valor_cobertura DECIMAL(10, 2),
    beneficiarios JSONB, -- [{"nome": "João Silva", "parentesco": "filho", "percentual": 50}]
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sinistros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apolice_id UUID REFERENCES apolices(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'morte', 'invalidez', 'inadimplencia'
    data_ocorrencia DATE NOT NULL,
    valor_solicitado DECIMAL(10, 2),
    valor_aprovado DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'em_analise', -- 'em_analise', 'aprovado', 'negado', 'pago'
    documentos JSONB, -- URLs dos documentos comprobatórios
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_resolucao TIMESTAMP
);

-- =============================================
-- TABELAS DE AUDITORIA E LOGS
-- =============================================

CREATE TABLE logs_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id),
    acao VARCHAR(100) NOT NULL,
    entidade VARCHAR(100), -- 'usuario', 'consulta', 'pedido', etc
    entidade_id UUID,
    ip VARCHAR(50),
    user_agent TEXT,
    dados_antes JSONB,
    dados_depois JSONB,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tentativas_login (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255),
    telefone VARCHAR(20),
    ip VARCHAR(50),
    sucesso BOOLEAN DEFAULT FALSE,
    motivo_falha VARCHAR(255),
    data_tentativa TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ÍNDICES PARA OTIMIZAÇÃO
-- =============================================

-- Índices de usuários
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_telefone ON usuarios(telefone);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo_usuario);

-- Índices de endereços
CREATE INDEX idx_enderecos_usuario ON enderecos(usuario_id);
CREATE INDEX idx_enderecos_coordenadas ON enderecos(latitude, longitude);

-- Índices de histórico médico
CREATE INDEX idx_historico_paciente ON historico_medico(paciente_id);
CREATE INDEX idx_alergias_historico ON alergias(historico_medico_id);
CREATE INDEX idx_doencas_historico ON doencas_cronicas(historico_medico_id);

-- Índices de consultas
CREATE INDEX idx_consultas_paciente ON consultas(paciente_id);
CREATE INDEX idx_consultas_profissional ON consultas(profissional_id);
CREATE INDEX idx_consultas_data ON consultas(data_hora);
CREATE INDEX idx_consultas_status ON consultas(status);

-- Índices de medicamentos
CREATE INDEX idx_medicamentos_nome ON medicamentos(nome);
CREATE INDEX idx_medicamentos_categoria ON medicamentos(categoria_id);
CREATE INDEX idx_medicamentos_estoque ON medicamentos(estoque);

-- Índices de pedidos
CREATE INDEX idx_pedidos_paciente ON pedidos(paciente_id);
CREATE INDEX idx_pedidos_numero ON pedidos(numero_pedido);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_data ON pedidos(data_criacao);

-- Índices de pagamentos
CREATE INDEX idx_pagamentos_usuario ON pagamentos(usuario_id);
CREATE INDEX idx_pagamentos_status ON pagamentos(status);
CREATE INDEX idx_pagamentos_data ON pagamentos(data_criacao);

-- Índices de notificações
CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);

-- =============================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =============================================

-- Trigger para atualizar timestamp de última atualização
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ultima_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_usuarios
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_atualizar_medicamentos
    BEFORE UPDATE ON medicamentos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

-- =============================================
-- VIEWS ÚTEIS
-- =============================================

-- View de consultas com informações completas
CREATE VIEW vw_consultas_completas AS
SELECT 
    c.*,
    p.nome_completo as paciente_nome,
    p.telefone as paciente_telefone,
    prof.nome_completo as profissional_nome,
    prof_det.numero_ordem as profissional_ordem,
    e.nome as especialidade_nome,
    endereco.provincia || ', ' || endereco.municipio || ', ' || endereco.bairro as endereco_completo
FROM consultas c
JOIN usuarios p ON c.paciente_id = p.id
JOIN profissionais_saude prof_det ON c.profissional_id = prof_det.id
JOIN usuarios prof ON prof_det.usuario_id = prof.id
JOIN especialidades e ON c.especialidade_id = e.id
LEFT JOIN enderecos endereco ON c.endereco_atendimento_id = endereco.id;

-- View de pedidos com totais
CREATE VIEW vw_pedidos_resumo AS
SELECT 
    p.*,
    u.nome_completo as paciente_nome,
    u.telefone as paciente_telefone,
    f.nome as farmacia_nome,
    COUNT(ip.id) as total_itens,
    e.status as status_entrega,
    e.codigo_rastreamento
FROM pedidos p
JOIN usuarios u ON p.paciente_id = u.id
LEFT JOIN farmacias f ON p.farmacia_id = f.id
LEFT JOIN itens_pedido ip ON p.id = ip.pedido_id
LEFT JOIN entregas e ON p.id = e.pedido_id
GROUP BY p.id, u.nome_completo, u.telefone, f.nome, e.status, e.codigo_rastreamento;

-- View de assinaturas ativas
CREATE VIEW vw_assinaturas_ativas AS
SELECT 
    a.*,
    u.nome_completo as paciente_nome,
    u.telefone as paciente_telefone,
    ps.nome as pacote_nome,
    ps.tipo as pacote_tipo,
    ep.nome as etapa_atual_nome,
    a.parcela_atual || '/' || a.parcelas as parcelas_info
FROM assinaturas_pacotes a
JOIN usuarios u ON a.paciente_id = u.id
JOIN pacotes_saude ps ON a.pacote_id = ps.id
LEFT JOIN etapas_pacote ep ON a.etapa_atual = ep.id
WHERE a.status = 'ativo';

-- =============================================
-- DADOS INICIAIS (SEEDS)
-- =============================================

-- Especialidades médicas
INSERT INTO especialidades (nome, descricao, icone) VALUES
('Clínico Geral', 'Atendimento médico geral e avaliações de rotina', '🩺'),
('Pediatria', 'Especialista em saúde infantil', '👶'),
('Psicologia', 'Atendimento psicológico e terapia', '🧠'),
('Psiquiatria', 'Tratamento de transtornos mentais', '💊'),
('Cardiologia', 'Especialista em saúde cardiovascular', '❤️'),
('Ginecologia', 'Saúde da mulher', '👩‍⚕️'),
('Fisioterapia', 'Reabilitação física e motora', '🏃'),
('Enfermagem', 'Cuidados de enfermagem domiciliar', '💉');

-- Categorias de medicamentos
INSERT INTO categorias_medicamentos (nome, descricao, icone) VALUES
('Analgésicos', 'Medicamentos para alívio da dor', '💊'),
('Antibióticos', 'Tratamento de infecções bacterianas', '💉'),
('Anti-inflamatórios', 'Redução de inflamações', '🔥'),
('Antidiabéticos', 'Controle de diabetes', '🩺'),
('Anti-hipertensivos', 'Controle de pressão arterial', '❤️'),
('Vitaminas', 'Suplementos vitamínicos', '🌟'),
('Dermatológicos', 'Tratamento de pele', '🧴'),
('Respiratórios', 'Tratamento de problemas respiratórios', '🫁');

-- Pacotes de saúde
INSERT INTO pacotes_saude (nome, tipo, descricao, duracao_meses, numero_consultas, servicos_inclusos, valor_total, parcelas_max) VALUES
('Saúde Mental Básico', 'mental', 'Acompanhamento psicológico mensal', 3, 3, '["3 Consultas com psicólogo", "Atendimento online ou domiciliar", "Suporte via chat"]', 45000.00, 3),
('Saúde Mental Premium', 'mental', 'Acompanhamento psicológico e psiquiátrico', 6, 8, '["6 Consultas com psicólogo", "2 Consultas com psiquiatra", "Medicamentos inclusos", "Monitoramento contínuo"]', 120000.00, 6),
('Materno-Infantil', 'materno_infantil', 'Acompanhamento pré-natal e pediatria', 12, 15, '["Consultas de pré-natal", "Exames", "Consultas pediátricas", "Vacinas", "Suporte 24/7"]', 180000.00, 6),
('Controle de Diabetes', 'cronicas', 'Monitoramento e controle de diabetes', 12, 12, '["Consultas mensais", "Glicosímetro incluso", "Medicamentos", "Exames laboratoriais", "Monitoramento remoto"]', 150000.00, 6),
('Cuidados Paliativos', 'paliativo', 'Cuidados para pacientes terminais', 6, 0, '["Atendimento domiciliar diário", "Equipe multidisciplinar", "Medicamentos para dor", "Suporte familiar"]', 300000.00, 6),
('Fisioterapia Intensiva', 'fisioterapia', 'Sessões de fisioterapia domiciliar', 3, 24, '["24 Sessões de fisioterapia", "Atendimento domiciliar", "Equipamentos inclusos"]', 90000.00, 3);
