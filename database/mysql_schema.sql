-- ============================================
-- FARMADOM - MYSQL DATABASE SCHEMA COMPLETO
-- Sistema de Saúde Domiciliar para Angola
-- Versão: 2.0 - Atualizado com todas as funcionalidades
-- ============================================

-- Configurar charset e collation
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Criar banco de dados se não existir
CREATE DATABASE IF NOT EXISTS farmadom
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE farmadom;

-- ============================================
-- LIMPAR TABELAS EXISTENTES (ordem reversa de dependências)
-- ============================================
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS comissoes_config;
DROP TABLE IF EXISTS logs_auditoria;
DROP TABLE IF EXISTS itens_receita;
DROP TABLE IF EXISTS receitas_digitais;
DROP TABLE IF EXISTS fila_rodizio;
DROP TABLE IF EXISTS rodizio_config;
DROP TABLE IF EXISTS farmacia_estoque;
DROP TABLE IF EXISTS itens_pedido;
DROP TABLE IF EXISTS entregas;
DROP TABLE IF EXISTS veiculos;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS pagamentos_assinaturas;
DROP TABLE IF EXISTS assinaturas_pacotes;
DROP TABLE IF EXISTS pacotes_saude;
DROP TABLE IF EXISTS consultas_signals;
DROP TABLE IF EXISTS mensagens_chat;
DROP TABLE IF EXISTS usuarios_online;
DROP TABLE IF EXISTS consultas;
DROP TABLE IF EXISTS profissionais_saude;
DROP TABLE IF EXISTS medicamentos;
DROP TABLE IF EXISTS empresas_transporte;
DROP TABLE IF EXISTS hospitais;
DROP TABLE IF EXISTS farmacias;
DROP TABLE IF EXISTS rastreamento_pedidos;
DROP TABLE IF EXISTS avaliacoes_consultas;
DROP TABLE IF EXISTS usuarios;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 1. TABELA: usuarios
-- ============================================
CREATE TABLE usuarios (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    nome_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    senha_hash VARCHAR(255) NOT NULL,
    nif VARCHAR(20),
    data_nascimento DATE,
    genero VARCHAR(20),
    tipo_usuario ENUM(
        'paciente', 
        'medico', 
        'farmacia_admin', 
        'farmacia_funcionario', 
        'hospital_gerente', 
        'transporte_gerente', 
        'motorista', 
        'admin',
        'enfermeiro',
        'entregador',
        'farmaceutico'
    ) NOT NULL DEFAULT 'paciente',
    foto_perfil TEXT,
    endereco_completo TEXT,
    cidade VARCHAR(100),
    provincia VARCHAR(100),
    is_ativo BOOLEAN DEFAULT TRUE,
    email_verificado BOOLEAN DEFAULT FALSE,
    telefone_verificado BOOLEAN DEFAULT FALSE,
    status_conta ENUM('ativo', 'pendente_aprovacao', 'aprovada', 'rejeitada', 'suspensa') DEFAULT 'ativo',
    entidade_id CHAR(36),
    entidade_tipo ENUM('farmacia', 'hospital', 'empresa_transporte'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_telefone (telefone),
    INDEX idx_tipo_usuario (tipo_usuario),
    INDEX idx_entidade (entidade_id),
    INDEX idx_status (status_conta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. TABELA: farmacias
-- ============================================
CREATE TABLE farmacias (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    nome VARCHAR(255) NOT NULL,
    endereco TEXT,
    cidade VARCHAR(100),
    provincia VARCHAR(100),
    zona VARCHAR(100),
    telefone VARCHAR(20),
    email VARCHAR(255),
    licenca VARCHAR(100),
    horario_funcionamento JSON,
    is_online BOOLEAN DEFAULT FALSE,
    is_ativa BOOLEAN DEFAULT TRUE,
    ultima_vez_online TIMESTAMP NULL,
    aceita_parcelamento BOOLEAN DEFAULT FALSE,
    penalidade_rodizio INT DEFAULT 0,
    ultimo_pedido_recebido TIMESTAMP NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    percentual_comissao DECIMAL(5, 2) DEFAULT 10.00,
    avaliacao_media DECIMAL(3, 2) DEFAULT 0.00,
    aprovada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_zona (zona),
    INDEX idx_online (is_online),
    INDEX idx_ativa (is_ativa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. TABELA: hospitais
-- ============================================
CREATE TABLE hospitais (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    nome VARCHAR(255) NOT NULL,
    endereco TEXT,
    cidade VARCHAR(100),
    provincia VARCHAR(100),
    telefone VARCHAR(20),
    email VARCHAR(255),
    licenca VARCHAR(100),
    tipo VARCHAR(100),
    especialidades JSON,
    percentual_hospital DECIMAL(5, 2) DEFAULT 30.00,
    aprovada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. TABELA: empresas_transporte
-- ============================================
CREATE TABLE empresas_transporte (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    nome VARCHAR(255) NOT NULL,
    endereco TEXT,
    cidade VARCHAR(100),
    provincia VARCHAR(100),
    telefone VARCHAR(20),
    email VARCHAR(255),
    cnpj VARCHAR(30),
    aprovada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. TABELA: profissionais_saude
-- ============================================
CREATE TABLE profissionais_saude (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    usuario_id CHAR(36) NOT NULL,
    especialidade VARCHAR(100),
    numero_ordem VARCHAR(50),
    anos_experiencia INT,
    biografia TEXT,
    atende_domicilio BOOLEAN DEFAULT TRUE,
    atende_online BOOLEAN DEFAULT TRUE,
    valor_consulta_online DECIMAL(10, 2),
    valor_consulta_domicilio DECIMAL(10, 2),
    disponivel BOOLEAN DEFAULT TRUE,
    hospital_id CHAR(36),
    avaliacao_media DECIMAL(3, 2) DEFAULT 0.00,
    total_avaliacoes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitais(id) ON DELETE SET NULL,
    INDEX idx_usuario (usuario_id),
    INDEX idx_hospital (hospital_id),
    INDEX idx_especialidade (especialidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. TABELA: consultas
-- ============================================
CREATE TABLE consultas (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    paciente_id CHAR(36) NOT NULL,
    medico_id CHAR(36),
    tipo_consulta ENUM('presencial', 'video', 'audio', 'chat') NOT NULL,
    especialidade VARCHAR(100),
    data_hora_agendada DATETIME NOT NULL,
    data_hora_realizada DATETIME,
    duracao_minutos INT DEFAULT 30,
    sintomas TEXT,
    diagnostico TEXT,
    prescricao TEXT,
    observacoes TEXT,
    valor DECIMAL(10,2),
    status ENUM('agendada', 'confirmada', 'em_andamento', 'concluida', 'cancelada') DEFAULT 'agendada',
    hospital_id CHAR(36),
    avaliacao INT CHECK (avaliacao >= 1 AND avaliacao <= 5),
    chat_ativo BOOLEAN DEFAULT FALSE,
    chat_iniciado_em TIMESTAMP NULL,
    video_ativo BOOLEAN DEFAULT FALSE,
    video_iniciado_em TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (medico_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (hospital_id) REFERENCES hospitais(id) ON DELETE SET NULL,
    INDEX idx_paciente (paciente_id),
    INDEX idx_medico (medico_id),
    INDEX idx_data_hora (data_hora_agendada),
    INDEX idx_status (status),
    INDEX idx_hospital (hospital_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. TABELA: consultas_signals (WebRTC)
-- ============================================
CREATE TABLE consultas_signals (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    consulta_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    signal_type VARCHAR(50) NOT NULL,
    signal_data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_consulta_user (consulta_id, user_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. TABELA: mensagens_chat
-- ============================================
CREATE TABLE mensagens_chat (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    consulta_id CHAR(36) NOT NULL,
    remetente_id CHAR(36) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo ENUM('texto', 'arquivo', 'sistema') DEFAULT 'texto',
    arquivo_url VARCHAR(500),
    arquivo_nome VARCHAR(255),
    lida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE,
    FOREIGN KEY (remetente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_consulta (consulta_id),
    INDEX idx_created (created_at),
    INDEX idx_remetente (remetente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. TABELA: usuarios_online
-- ============================================
CREATE TABLE usuarios_online (
    usuario_id CHAR(36) PRIMARY KEY,
    socket_id VARCHAR(255) NOT NULL,
    consulta_id CHAR(36),
    ultima_atividade TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE SET NULL,
    INDEX idx_socket (socket_id),
    INDEX idx_consulta (consulta_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. TABELA: medicamentos
-- ============================================
CREATE TABLE medicamentos (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    nome VARCHAR(255) NOT NULL,
    principio_ativo VARCHAR(255),
    categoria VARCHAR(100),
    dosagem VARCHAR(100),
    forma_farmaceutica VARCHAR(100),
    fabricante VARCHAR(255),
    preco DECIMAL(10, 2) DEFAULT 0,
    estoque INT DEFAULT 0,
    prescricao_necessaria BOOLEAN DEFAULT FALSE,
    requer_receita BOOLEAN DEFAULT FALSE,
    descricao TEXT,
    posologia TEXT,
    contraindicacoes TEXT,
    imagem_url TEXT,
    is_ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nome (nome),
    INDEX idx_categoria (categoria),
    INDEX idx_ativo (is_ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. TABELA: pacotes_saude
-- ============================================
CREATE TABLE pacotes_saude (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(50),
    preco_mensal DECIMAL(10, 2) NOT NULL,
    duracao_meses INT DEFAULT 1,
    beneficios JSON,
    limite_consultas INT,
    desconto_medicamentos DECIMAL(5, 2) DEFAULT 0,
    is_ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. TABELA: assinaturas_pacotes
-- ============================================
CREATE TABLE assinaturas_pacotes (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    usuario_id CHAR(36) NOT NULL,
    pacote_id CHAR(36) NOT NULL,
    data_inicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_fim TIMESTAMP NULL,
    status ENUM('ativa', 'suspensa', 'cancelada', 'expirada') DEFAULT 'ativa',
    valor_pago DECIMAL(10, 2),
    metodo_pagamento VARCHAR(50),
    proxima_cobranca TIMESTAMP NULL,
    cancelado_em TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (pacote_id) REFERENCES pacotes_saude(id) ON DELETE RESTRICT,
    INDEX idx_usuario (usuario_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 13. TABELA: pagamentos_assinaturas
-- ============================================
CREATE TABLE pagamentos_assinaturas (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    assinatura_id CHAR(36) NOT NULL,
    usuario_id CHAR(36) NOT NULL,
    pacote_id CHAR(36),
    valor DECIMAL(10, 2) NOT NULL,
    metodo_pagamento VARCHAR(50),
    status ENUM('pendente', 'pago', 'cancelado', 'reembolsado') DEFAULT 'pendente',
    referencia_pagamento VARCHAR(100),
    data_pagamento TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assinatura_id) REFERENCES assinaturas_pacotes(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (pacote_id) REFERENCES pacotes_saude(id) ON DELETE SET NULL,
    INDEX idx_assinatura (assinatura_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 14. TABELA: pedidos
-- ============================================
CREATE TABLE pedidos (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    usuario_id CHAR(36) NOT NULL,
    farmacia_id CHAR(36),
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    status ENUM(
        'pendente', 
        'confirmado', 
        'aguardando_farmacia',
        'em_preparacao', 
        'pronto_entrega',
        'enviado', 
        'entregue', 
        'cancelado'
    ) DEFAULT 'pendente',
    total DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    taxa_entrega DECIMAL(10,2) DEFAULT 0,
    desconto DECIMAL(10,2) DEFAULT 0,
    metodo_pagamento VARCHAR(50),
    endereco_entrega TEXT,
    observacoes TEXT,
    zona_entrega VARCHAR(100),
    parcelado BOOLEAN DEFAULT FALSE,
    numero_parcelas INT DEFAULT 1,
    data_entrega_estimada DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (farmacia_id) REFERENCES farmacias(id) ON DELETE SET NULL,
    INDEX idx_usuario (usuario_id),
    INDEX idx_farmacia (farmacia_id),
    INDEX idx_numero_pedido (numero_pedido),
    INDEX idx_status (status),
    INDEX idx_zona (zona_entrega)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 15. TABELA: itens_pedido
-- ============================================
CREATE TABLE itens_pedido (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    pedido_id CHAR(36) NOT NULL,
    medicamento_id CHAR(36) NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE RESTRICT,
    INDEX idx_pedido (pedido_id),
    INDEX idx_medicamento (medicamento_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 16. TABELA: farmacia_estoque
-- ============================================
CREATE TABLE farmacia_estoque (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    farmacia_id CHAR(36) NOT NULL,
    medicamento_id CHAR(36) NOT NULL,
    quantidade INT DEFAULT 0,
    preco_farmacia DECIMAL(10, 2),
    data_validade DATE,
    lote VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (farmacia_id) REFERENCES farmacias(id) ON DELETE CASCADE,
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_farmacia_medicamento (farmacia_id, medicamento_id),
    INDEX idx_farmacia (farmacia_id),
    INDEX idx_medicamento (medicamento_id),
    INDEX idx_quantidade (quantidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 17. TABELA: fila_rodizio
-- ============================================
CREATE TABLE fila_rodizio (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    pedido_id CHAR(36) NOT NULL,
    farmacia_id CHAR(36) NOT NULL,
    posicao INT NOT NULL,
    status ENUM('pendente', 'enviado', 'aceito', 'recusado', 'expirado') DEFAULT 'pendente',
    enviado_em TIMESTAMP NULL,
    respondido_em TIMESTAMP NULL,
    motivo_recusa TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (farmacia_id) REFERENCES farmacias(id) ON DELETE CASCADE,
    INDEX idx_pedido (pedido_id),
    INDEX idx_farmacia (farmacia_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 18. TABELA: rodizio_config
-- ============================================
CREATE TABLE rodizio_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor VARCHAR(255) NOT NULL,
    descricao TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 19. TABELA: receitas_digitais
-- ============================================
CREATE TABLE receitas_digitais (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    consulta_id CHAR(36),
    medico_id CHAR(36) NOT NULL,
    paciente_id CHAR(36) NOT NULL,
    codigo_verificacao CHAR(36) DEFAULT (UUID()),
    qr_code_hash VARCHAR(255),
    validade TIMESTAMP NULL,
    status ENUM('ativa', 'utilizada', 'expirada', 'cancelada') DEFAULT 'ativa',
    farmacia_dispensou_id CHAR(36),
    dispensado_em TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE SET NULL,
    FOREIGN KEY (medico_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (farmacia_dispensou_id) REFERENCES farmacias(id) ON DELETE SET NULL,
    INDEX idx_medico (medico_id),
    INDEX idx_paciente (paciente_id),
    INDEX idx_codigo (codigo_verificacao),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 20. TABELA: itens_receita
-- ============================================
CREATE TABLE itens_receita (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    receita_id CHAR(36) NOT NULL,
    medicamento_id CHAR(36),
    quantidade INT NOT NULL,
    dosagem VARCHAR(255),
    instrucoes TEXT,
    FOREIGN KEY (receita_id) REFERENCES receitas_digitais(id) ON DELETE CASCADE,
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE SET NULL,
    INDEX idx_receita (receita_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21. TABELA: veiculos
-- ============================================
CREATE TABLE veiculos (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    empresa_id CHAR(36) NOT NULL,
    placa VARCHAR(20) NOT NULL,
    modelo VARCHAR(100),
    tipo VARCHAR(50),
    capacidade_kg DECIMAL(8, 2),
    is_ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas_transporte(id) ON DELETE CASCADE,
    INDEX idx_empresa (empresa_id),
    INDEX idx_placa (placa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 22. TABELA: entregas
-- ============================================
CREATE TABLE entregas (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    pedido_id CHAR(36) NOT NULL,
    farmacia_id CHAR(36),
    empresa_transporte_id CHAR(36),
    motorista_id CHAR(36),
    veiculo_id CHAR(36),
    status ENUM('aguardando', 'aceita', 'recolhida', 'em_transito', 'entregue', 'cancelada') DEFAULT 'aguardando',
    valor_entrega DECIMAL(10, 2) DEFAULT 0,
    latitude_atual DECIMAL(10, 8),
    longitude_atual DECIMAL(11, 8),
    aceita_em TIMESTAMP NULL,
    recolhida_em TIMESTAMP NULL,
    entregue_em TIMESTAMP NULL,
    foto_comprovante TEXT,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (farmacia_id) REFERENCES farmacias(id) ON DELETE SET NULL,
    FOREIGN KEY (empresa_transporte_id) REFERENCES empresas_transporte(id) ON DELETE SET NULL,
    FOREIGN KEY (motorista_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE SET NULL,
    INDEX idx_pedido (pedido_id),
    INDEX idx_motorista (motorista_id),
    INDEX idx_empresa (empresa_transporte_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 23. TABELA: rastreamento_pedidos
-- ============================================
CREATE TABLE rastreamento_pedidos (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    pedido_id CHAR(36) NOT NULL,
    status VARCHAR(50) NOT NULL,
    descricao TEXT,
    localizacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    INDEX idx_pedido (pedido_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 24. TABELA: avaliacoes_consultas
-- ============================================
CREATE TABLE avaliacoes_consultas (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    consulta_id CHAR(36) NOT NULL,
    nota INT NOT NULL CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE,
    INDEX idx_consulta (consulta_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 25. TABELA: logs_auditoria
-- ============================================
CREATE TABLE logs_auditoria (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    usuario_id CHAR(36),
    acao VARCHAR(100) NOT NULL,
    detalhes JSON,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_usuario (usuario_id),
    INDEX idx_acao (acao),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 26. TABELA: comissoes_config
-- ============================================
CREATE TABLE comissoes_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_servico VARCHAR(100) UNIQUE NOT NULL,
    percentual DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
    descricao TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DADOS INICIAIS (Seed Data)
-- ============================================

-- Configuração do Rodízio
INSERT INTO rodizio_config (chave, valor, descricao) VALUES
('max_recusas_antes_penalidade', '3', 'Máximo de recusas antes de penalidade'),
('tempo_penalidade_minutos', '30', 'Tempo de penalidade em minutos'),
('tempo_resposta_segundos', '300', 'Tempo máximo de resposta em segundos (5 min)'),
('raio_busca_km', '10', 'Raio de busca em km');

-- Configuração de Comissões
INSERT INTO comissoes_config (tipo_servico, percentual, descricao) VALUES
('farmacia', 10.00, 'Comissão sobre vendas de farmácia'),
('transporte', 15.00, 'Comissão sobre entregas'),
('consulta', 20.00, 'Comissão sobre consultas médicas');

-- Medicamentos de exemplo
INSERT INTO medicamentos (nome, principio_ativo, fabricante, categoria, preco, estoque, prescricao_necessaria, descricao) VALUES
('Paracetamol 500mg', 'Paracetamol', 'Farmácia Nacional', 'Analgésicos', 500.00, 100, false, 'Analgésico e antipirético'),
('Dipirona 1g', 'Dipirona', 'Farmácia Nacional', 'Analgésicos', 450.00, 120, false, 'Analgésico e antipirético'),
('Aspirina 500mg', 'Ácido Acetilsalicílico', 'Bayer', 'Analgésicos', 680.00, 90, false, 'Analgésico e anti-inflamatório'),
('Ibuprofeno 400mg', 'Ibuprofeno', 'Farmácia Nacional', 'Anti-inflamatórios', 750.00, 80, false, 'Anti-inflamatório não esteroidal'),
('Diclofenaco 50mg', 'Diclofenaco', 'Voltaren', 'Anti-inflamatórios', 890.00, 70, false, 'Anti-inflamatório para dores musculares'),
('Amoxicilina 500mg', 'Amoxicilina', 'Farmácia Nacional', 'Antibióticos', 1200.00, 50, true, 'Antibiótico de amplo espectro'),
('Azitromicina 500mg', 'Azitromicina', 'Farmácia Nacional', 'Antibióticos', 1500.00, 45, true, 'Antibiótico para infecções respiratórias'),
('Omeprazol 20mg', 'Omeprazol', 'Farmácia Nacional', 'Gastrointestinais', 980.00, 60, false, 'Inibidor da bomba de prótons'),
('Buscopan 10mg', 'Escopolamina', 'Boehringer', 'Gastrointestinais', 890.00, 70, false, 'Antiespasmódico para cólicas'),
('Vitamina C 1g', 'Ácido Ascórbico', 'Redoxon', 'Vitaminas', 850.00, 120, false, 'Suplemento vitamínico para imunidade'),
('Complexo B', 'Vitaminas do Complexo B', 'Farmácia Nacional', 'Vitaminas', 680.00, 110, false, 'Suplemento de vitaminas B'),
('Losartana 50mg', 'Losartana Potássica', 'Farmácia Nacional', 'Anti-hipertensivos', 1100.00, 60, true, 'Antihipertensivo'),
('Enalapril 10mg', 'Enalapril', 'Farmácia Nacional', 'Anti-hipertensivos', 950.00, 55, true, 'Inibidor da ECA'),
('Metformina 850mg', 'Metformina', 'Farmácia Nacional', 'Antidiabéticos', 800.00, 70, true, 'Antidiabético oral'),
('Glibenclamida 5mg', 'Glibenclamida', 'Farmácia Nacional', 'Antidiabéticos', 750.00, 65, true, 'Hipoglicemiante oral');

-- Pacotes de saúde
INSERT INTO pacotes_saude (nome, descricao, tipo, preco_mensal, duracao_meses, beneficios, limite_consultas, desconto_medicamentos) VALUES
('Básico', 'Plano básico com consultas e descontos em medicamentos', 'individual', 5000.00, 1, JSON_ARRAY('2 consultas mensais', '10% desconto em medicamentos', 'Suporte 24/7'), 2, 10.00),
('Familiar', 'Plano familiar para até 5 pessoas', 'familiar', 15000.00, 1, JSON_ARRAY('5 consultas mensais', '15% desconto em medicamentos', 'Exames básicos incluídos', 'Suporte 24/7'), 5, 15.00),
('Premium', 'Plano premium com consultas ilimitadas', 'premium', 25000.00, 1, JSON_ARRAY('Consultas ilimitadas', '20% desconto em medicamentos', 'Exames incluídos', 'Monitoramento de saúde', 'Suporte prioritário'), NULL, 20.00),
('Empresarial', 'Plano para empresas e colaboradores', 'empresarial', 8000.00, 1, JSON_ARRAY('3 consultas mensais por colaborador', '12% desconto em medicamentos', 'Medicina do trabalho', 'Relatórios de saúde'), 3, 12.00);

-- Usuário Admin Padrão (senha: admin123)
INSERT INTO usuarios (nome_completo, email, senha_hash, tipo_usuario, status_conta, is_ativo)
VALUES ('Administrador FarmaDom', 'admin@farmadom.ao', '$2a$10$84vdjamh9YJ4bN2j7ztvWOmU8/OeH0XODqOUk37CZ5rBOWlofo2uC', 'admin', 'ativo', true);

-- Verificação Final
SELECT 'Schema FarmaDom criado com sucesso!' as status;
