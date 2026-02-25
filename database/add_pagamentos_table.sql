-- ============================================
-- TABELA: pagamentos_assinaturas
-- ============================================
CREATE TABLE IF NOT EXISTS pagamentos_assinaturas (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    assinatura_id CHAR(36) NOT NULL,
    usuario_id CHAR(36) NOT NULL,
    pacote_id CHAR(36) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    metodo_pagamento ENUM('cartao', 'multicaixa', 'transferencia') NOT NULL,
    status ENUM('pendente', 'aprovado', 'recusado', 'cancelado') DEFAULT 'pendente',
    referencia_pagamento VARCHAR(255),
    data_pagamento TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assinatura_id) REFERENCES assinaturas_pacotes(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (pacote_id) REFERENCES pacotes_saude(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar campos à tabela assinaturas_pacotes se ainda não existirem
ALTER TABLE assinaturas_pacotes 
    ADD COLUMN IF NOT EXISTS valor_pago DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS metodo_pagamento ENUM('cartao', 'multicaixa', 'transferencia'),
    ADD COLUMN IF NOT EXISTS proxima_cobranca TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS cancelado_em TIMESTAMP NULL DEFAULT NULL;

-- Índices para melhor performance
CREATE INDEX idx_pagamentos_assinatura ON pagamentos_assinaturas(assinatura_id);
CREATE INDEX idx_pagamentos_usuario ON pagamentos_assinaturas(usuario_id);
CREATE INDEX idx_pagamentos_status ON pagamentos_assinaturas(status);
CREATE INDEX idx_assinaturas_usuario_status ON assinaturas_pacotes(usuario_id, status);
