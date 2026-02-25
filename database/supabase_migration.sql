-- =============================================
-- FARMADOM — SUPABASE MIGRATION
-- Execute this in Supabase SQL Editor
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- LIMPAR TABELAS EXISTENTES (ordem reversa de dependências)
-- =============================================
DROP TABLE IF EXISTS comissoes_config CASCADE;
DROP TABLE IF EXISTS logs_auditoria CASCADE;
DROP TABLE IF EXISTS itens_receita CASCADE;
DROP TABLE IF EXISTS receitas_digitais CASCADE;
DROP TABLE IF EXISTS fila_rodizio CASCADE;
DROP TABLE IF EXISTS rodizio_config CASCADE;
DROP TABLE IF EXISTS farmacia_estoque CASCADE;
DROP TABLE IF EXISTS itens_pedido CASCADE;
DROP TABLE IF EXISTS entregas CASCADE;
DROP TABLE IF EXISTS veiculos CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS pagamentos_assinaturas CASCADE;
DROP TABLE IF EXISTS assinaturas_pacotes CASCADE;
DROP TABLE IF EXISTS pacotes_saude CASCADE;
DROP TABLE IF EXISTS consultas_signals CASCADE;
DROP TABLE IF EXISTS consultas CASCADE;
DROP TABLE IF EXISTS profissionais_saude CASCADE;
DROP TABLE IF EXISTS medicamentos CASCADE;
DROP TABLE IF EXISTS empresas_transporte CASCADE;
DROP TABLE IF EXISTS hospitais CASCADE;
DROP TABLE IF EXISTS farmacias CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- =============================================
-- 1. TABELA: usuarios
-- =============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    senha_hash VARCHAR(255) NOT NULL,
    nif VARCHAR(20),
    data_nascimento DATE,
    genero VARCHAR(20),
    tipo_usuario VARCHAR(50) NOT NULL DEFAULT 'paciente',
    -- CHECK (tipo_usuario IN ('paciente','medico','farmacia_admin','farmacia_funcionario','hospital_gerente','transporte_gerente','motorista','admin'))
    foto_perfil TEXT,
    endereco_completo TEXT,
    cidade VARCHAR(100),
    provincia VARCHAR(100),
    is_ativo BOOLEAN DEFAULT TRUE,
    status_conta VARCHAR(50) DEFAULT 'ativo',
    -- CHECK (status_conta IN ('ativo','pendente_aprovacao','aprovada','rejeitada','suspensa'))
    entidade_id UUID,
    entidade_tipo VARCHAR(50),
    -- CHECK (entidade_tipo IN ('farmacia','hospital','empresa_transporte'))
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_entidade ON usuarios(entidade_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status_conta);

-- =============================================
-- 2. TABELA: farmacias
-- =============================================
CREATE TABLE IF NOT EXISTS farmacias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    endereco TEXT,
    cidade VARCHAR(100),
    provincia VARCHAR(100),
    zona VARCHAR(100),
    telefone VARCHAR(20),
    email VARCHAR(255),
    licenca VARCHAR(100),
    horario_funcionamento JSONB,
    is_online BOOLEAN DEFAULT FALSE,
    is_ativa BOOLEAN DEFAULT TRUE,
    ultima_vez_online TIMESTAMPTZ,
    aceita_parcelamento BOOLEAN DEFAULT FALSE,
    penalidade_rodizio INTEGER DEFAULT 0,
    ultimo_pedido_recebido TIMESTAMPTZ,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    percentual_comissao DECIMAL(5, 2) DEFAULT 10.00,
    avaliacao_media DECIMAL(3, 2) DEFAULT 0.00,
    aprovada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farmacias_zona ON farmacias(zona);
CREATE INDEX IF NOT EXISTS idx_farmacias_online ON farmacias(is_online);

-- =============================================
-- 3. TABELA: hospitais
-- =============================================
CREATE TABLE IF NOT EXISTS hospitais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    endereco TEXT,
    cidade VARCHAR(100),
    provincia VARCHAR(100),
    telefone VARCHAR(20),
    email VARCHAR(255),
    licenca VARCHAR(100),
    tipo VARCHAR(100),
    especialidades JSONB,
    percentual_hospital DECIMAL(5, 2) DEFAULT 30.00,
    aprovada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. TABELA: empresas_transporte
-- =============================================
CREATE TABLE IF NOT EXISTS empresas_transporte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    endereco TEXT,
    cidade VARCHAR(100),
    provincia VARCHAR(100),
    telefone VARCHAR(20),
    email VARCHAR(255),
    cnpj VARCHAR(30),
    aprovada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. TABELA: profissionais_saude
-- =============================================
CREATE TABLE IF NOT EXISTS profissionais_saude (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    especialidade VARCHAR(100),
    numero_ordem VARCHAR(50),
    anos_experiencia INTEGER,
    biografia TEXT,
    atende_domicilio BOOLEAN DEFAULT TRUE,
    atende_online BOOLEAN DEFAULT TRUE,
    valor_consulta_online DECIMAL(10, 2),
    valor_consulta_domicilio DECIMAL(10, 2),
    disponivel BOOLEAN DEFAULT TRUE,
    hospital_id UUID REFERENCES hospitais(id) ON DELETE SET NULL,
    avaliacao_media DECIMAL(3, 2) DEFAULT 0.00,
    total_avaliacoes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profissionais_usuario ON profissionais_saude(usuario_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_hospital ON profissionais_saude(hospital_id);

-- =============================================
-- 6. TABELA: consultas
-- =============================================
CREATE TABLE IF NOT EXISTS consultas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    medico_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo_consulta VARCHAR(50) NOT NULL,
    especialidade VARCHAR(100),
    data_hora_agendada TIMESTAMPTZ NOT NULL,
    data_hora_realizada TIMESTAMPTZ,
    duracao_minutos INTEGER DEFAULT 30,
    sintomas TEXT,
    diagnostico TEXT,
    prescricao TEXT,
    observacoes TEXT,
    valor DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'agendada',
    hospital_id UUID REFERENCES hospitais(id) ON DELETE SET NULL,
    avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultas_paciente ON consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_consultas_medico ON consultas(medico_id);
CREATE INDEX IF NOT EXISTS idx_consultas_status ON consultas(status);
CREATE INDEX IF NOT EXISTS idx_consultas_data ON consultas(data_hora_agendada);
CREATE INDEX IF NOT EXISTS idx_consultas_hospital ON consultas(hospital_id);

-- =============================================
-- 7. TABELA: consultas_signals (WebRTC)
-- =============================================
CREATE TABLE IF NOT EXISTS consultas_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consulta_id UUID REFERENCES consultas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    signal_type VARCHAR(50) NOT NULL,
    signal_data TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signals_consulta ON consultas_signals(consulta_id, user_id);

-- =============================================
-- 8. TABELA: medicamentos
-- =============================================
CREATE TABLE IF NOT EXISTS medicamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    principio_ativo VARCHAR(255),
    categoria VARCHAR(100),
    dosagem VARCHAR(100),
    forma_farmaceutica VARCHAR(100),
    fabricante VARCHAR(255),
    preco DECIMAL(10, 2) DEFAULT 0,
    estoque INTEGER DEFAULT 0,
    prescricao_necessaria BOOLEAN DEFAULT FALSE,
    requer_receita BOOLEAN DEFAULT FALSE,
    descricao TEXT,
    posologia TEXT,
    contraindicacoes TEXT,
    imagem_url TEXT,
    is_ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicamentos_nome ON medicamentos(nome);
CREATE INDEX IF NOT EXISTS idx_medicamentos_categoria ON medicamentos(categoria);
CREATE INDEX IF NOT EXISTS idx_medicamentos_ativo ON medicamentos(is_ativo);

-- =============================================
-- 9. TABELA: pacotes_saude
-- =============================================
CREATE TABLE IF NOT EXISTS pacotes_saude (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco_mensal DECIMAL(10, 2),
    tipo VARCHAR(50),
    beneficios TEXT,
    limite_consultas INTEGER,
    desconto_medicamentos DECIMAL(5, 2) DEFAULT 0,
    duracao_meses INTEGER DEFAULT 1,
    is_ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 10. TABELA: assinaturas_pacotes
-- =============================================
CREATE TABLE IF NOT EXISTS assinaturas_pacotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    pacote_id UUID REFERENCES pacotes_saude(id) ON DELETE SET NULL,
    data_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_fim TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'ativa',
    valor_pago DECIMAL(10, 2),
    metodo_pagamento VARCHAR(50),
    proxima_cobranca TIMESTAMPTZ,
    cancelado_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assinaturas_usuario ON assinaturas_pacotes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON assinaturas_pacotes(status);

-- =============================================
-- 11. TABELA: pagamentos_assinaturas
-- =============================================
CREATE TABLE IF NOT EXISTS pagamentos_assinaturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assinatura_id UUID REFERENCES assinaturas_pacotes(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    pacote_id UUID REFERENCES pacotes_saude(id) ON DELETE SET NULL,
    valor DECIMAL(10, 2) NOT NULL,
    metodo_pagamento VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pendente',
    referencia_pagamento VARCHAR(100),
    data_pagamento TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 12. TABELA: pedidos
-- =============================================
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    farmacia_id UUID REFERENCES farmacias(id) ON DELETE SET NULL,
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente',
    total DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    taxa_entrega DECIMAL(10, 2) DEFAULT 0,
    desconto DECIMAL(10, 2) DEFAULT 0,
    metodo_pagamento VARCHAR(50),
    endereco_entrega TEXT,
    observacoes TEXT,
    zona_entrega VARCHAR(100),
    parcelado BOOLEAN DEFAULT FALSE,
    numero_parcelas INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_farmacia ON pedidos(farmacia_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON pedidos(numero_pedido);

-- =============================================
-- 13. TABELA: itens_pedido
-- =============================================
CREATE TABLE IF NOT EXISTS itens_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    medicamento_id UUID REFERENCES medicamentos(id) ON DELETE SET NULL,
    quantidade INTEGER NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido ON itens_pedido(pedido_id);

-- =============================================
-- 14. TABELA: farmacia_estoque
-- =============================================
CREATE TABLE IF NOT EXISTS farmacia_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmacia_id UUID REFERENCES farmacias(id) ON DELETE CASCADE,
    medicamento_id UUID REFERENCES medicamentos(id) ON DELETE CASCADE,
    quantidade INTEGER DEFAULT 0,
    preco_farmacia DECIMAL(10, 2),
    data_validade DATE,
    lote VARCHAR(50),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(farmacia_id, medicamento_id)
);

CREATE INDEX IF NOT EXISTS idx_estoque_farmacia ON farmacia_estoque(farmacia_id);
CREATE INDEX IF NOT EXISTS idx_estoque_medicamento ON farmacia_estoque(medicamento_id);

-- =============================================
-- 15. TABELA: fila_rodizio
-- =============================================
CREATE TABLE IF NOT EXISTS fila_rodizio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    farmacia_id UUID REFERENCES farmacias(id) ON DELETE CASCADE,
    posicao INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente',
    enviado_em TIMESTAMPTZ,
    respondido_em TIMESTAMPTZ,
    motivo_recusa TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rodizio_pedido ON fila_rodizio(pedido_id);
CREATE INDEX IF NOT EXISTS idx_rodizio_farmacia ON fila_rodizio(farmacia_id);
CREATE INDEX IF NOT EXISTS idx_rodizio_status ON fila_rodizio(status);

-- =============================================
-- 16. TABELA: rodizio_config
-- =============================================
CREATE TABLE IF NOT EXISTS rodizio_config (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor VARCHAR(255) NOT NULL,
    descricao TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default config
INSERT INTO rodizio_config (chave, valor, descricao) VALUES
('max_recusas_antes_penalidade', '3', 'Máximo de recusas antes de penalidade'),
('tempo_penalidade_minutos', '30', 'Tempo de penalidade em minutos'),
('tempo_resposta_segundos', '300', 'Tempo máximo de resposta em segundos'),
('raio_busca_km', '10', 'Raio de busca em km')
ON CONFLICT (chave) DO NOTHING;

-- =============================================
-- 17. TABELA: receitas_digitais
-- =============================================
CREATE TABLE IF NOT EXISTS receitas_digitais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consulta_id UUID REFERENCES consultas(id) ON DELETE SET NULL,
    medico_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    paciente_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo_verificacao UUID DEFAULT gen_random_uuid(),
    qr_code_hash VARCHAR(255),
    validade TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'ativa',
    farmacia_dispensou_id UUID REFERENCES farmacias(id) ON DELETE SET NULL,
    dispensado_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receitas_medico ON receitas_digitais(medico_id);
CREATE INDEX IF NOT EXISTS idx_receitas_paciente ON receitas_digitais(paciente_id);
CREATE INDEX IF NOT EXISTS idx_receitas_codigo ON receitas_digitais(codigo_verificacao);
CREATE INDEX IF NOT EXISTS idx_receitas_status ON receitas_digitais(status);

-- =============================================
-- 18. TABELA: itens_receita
-- =============================================
CREATE TABLE IF NOT EXISTS itens_receita (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receita_id UUID REFERENCES receitas_digitais(id) ON DELETE CASCADE,
    medicamento_id UUID REFERENCES medicamentos(id) ON DELETE SET NULL,
    quantidade INTEGER NOT NULL,
    dosagem VARCHAR(255),
    instrucoes TEXT
);

CREATE INDEX IF NOT EXISTS idx_itens_receita_receita ON itens_receita(receita_id);

-- =============================================
-- 19. TABELA: veiculos (ANTES de entregas por causa da FK)
-- =============================================
CREATE TABLE IF NOT EXISTS veiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas_transporte(id) ON DELETE CASCADE,
    placa VARCHAR(20) NOT NULL,
    modelo VARCHAR(100),
    tipo VARCHAR(50),
    capacidade_kg DECIMAL(8, 2),
    is_ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_veiculos_empresa ON veiculos(empresa_id);

-- =============================================
-- 20. TABELA: entregas
-- =============================================
CREATE TABLE IF NOT EXISTS entregas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    farmacia_id UUID REFERENCES farmacias(id) ON DELETE SET NULL,
    empresa_transporte_id UUID REFERENCES empresas_transporte(id) ON DELETE SET NULL,
    motorista_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    veiculo_id UUID REFERENCES veiculos(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'aguardando',
    valor_entrega DECIMAL(10, 2) DEFAULT 0,
    latitude_atual DECIMAL(10, 8),
    longitude_atual DECIMAL(11, 8),
    aceita_em TIMESTAMPTZ,
    recolhido_em TIMESTAMPTZ,
    entregue_em TIMESTAMPTZ,
    foto_comprovante TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entregas_pedido ON entregas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_entregas_motorista ON entregas(motorista_id);
CREATE INDEX IF NOT EXISTS idx_entregas_empresa ON entregas(empresa_transporte_id);
CREATE INDEX IF NOT EXISTS idx_entregas_status ON entregas(status);

-- =============================================
-- 21. TABELA: logs_auditoria
-- =============================================
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    acao VARCHAR(100) NOT NULL,
    detalhes JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_acao ON logs_auditoria(acao);

-- =============================================
-- 22. TABELA: comissoes_config
-- =============================================
CREATE TABLE IF NOT EXISTS comissoes_config (
    id SERIAL PRIMARY KEY,
    tipo_servico VARCHAR(100) UNIQUE NOT NULL,
    percentual DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
    descricao TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default commission config
INSERT INTO comissoes_config (tipo_servico, percentual, descricao) VALUES
('farmacia', 10.00, 'Comissão sobre vendas de farmácia'),
('transporte', 15.00, 'Comissão sobre entregas'),
('consulta', 20.00, 'Comissão sobre consultas médicas')
ON CONFLICT (tipo_servico) DO NOTHING;

-- =============================================
-- TRIGGER: Atualizar updated_at automaticamente
-- =============================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT table_name FROM information_schema.columns
        WHERE column_name = 'updated_at'
          AND table_schema = 'public'
        GROUP BY table_name
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS set_updated_at ON %I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
            t, t
        );
    END LOOP;
END;
$$;

-- =============================================
-- ROW LEVEL SECURITY (RLS) - Supabase
-- Enable RLS on all tables but allow service_role bypass
-- Our backend uses service_role key, so RLS won't block it
-- =============================================

-- Enable RLS (but bypass with service_role key from backend)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmacias ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitais ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas_transporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais_saude ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacotes_saude ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas_pacotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmacia_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE fila_rodizio ENABLE ROW LEVEL SECURITY;
ALTER TABLE rodizio_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE receitas_digitais ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_receita ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes_config ENABLE ROW LEVEL SECURITY;

-- Allow service_role (backend) full access to all tables
-- The backend connects with the service_role key which bypasses RLS
-- For anon/authenticated users accessing directly, add specific policies

-- Public read access for medicamentos and pacotes
CREATE POLICY "Medicamentos are viewable by everyone" ON medicamentos
    FOR SELECT USING (true);

CREATE POLICY "Pacotes are viewable by everyone" ON pacotes_saude
    FOR SELECT USING (true);

-- Service role has full access by default in Supabase

-- =============================================
-- SEED DATA: Medicamentos
-- =============================================
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
('Metformina 850mg', 'Metformina', 'Farmácia Nacional', 'Antidiabéticos', 600.00, 80, true, 'Controle de diabetes tipo 2'),
('Losartana 50mg', 'Losartana Potássica', 'Farmácia Nacional', 'Anti-hipertensivos', 700.00, 90, true, 'Controle de pressão arterial'),
('Enalapril 10mg', 'Enalapril', 'Farmácia Nacional', 'Anti-hipertensivos', 550.00, 85, true, 'Controle de pressão arterial'),
('Cetirizina 10mg', 'Cetirizina', 'Farmácia Nacional', 'Antialérgicos', 400.00, 100, false, 'Anti-histamínico para alergias')
ON CONFLICT DO NOTHING;

-- =============================================
-- SEED DATA: Pacotes de Saúde
-- =============================================
INSERT INTO pacotes_saude (nome, descricao, tipo, preco_mensal, duracao_meses, beneficios, limite_consultas, desconto_medicamentos) VALUES
('Básico', 'Plano básico com consultas e descontos em medicamentos', 'individual', 5000.00, 1, '["2 consultas mensais", "10% desconto em medicamentos", "Suporte 24/7"]', 2, 10.00),
('Familiar', 'Plano familiar para até 5 pessoas', 'familiar', 15000.00, 1, '["5 consultas mensais", "15% desconto em medicamentos", "Exames básicos incluídos", "Suporte 24/7"]', 5, 15.00),
('Premium', 'Plano premium com consultas ilimitadas', 'premium', 25000.00, 1, '["Consultas ilimitadas", "20% desconto em medicamentos", "Exames incluídos", "Monitoramento de saúde", "Suporte prioritário"]', NULL, 20.00)
ON CONFLICT DO NOTHING;
