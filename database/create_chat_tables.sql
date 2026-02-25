-- Tabela para armazenar mensagens do chat
CREATE TABLE IF NOT EXISTS mensagens_chat (
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
    INDEX idx_consulta_id (consulta_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para rastrear quem está online
CREATE TABLE IF NOT EXISTS usuarios_online (
    usuario_id CHAR(36) PRIMARY KEY,
    socket_id VARCHAR(255) NOT NULL,
    consulta_id CHAR(36),
    ultima_atividade TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar campo para indicar se consulta tem chat ativo
ALTER TABLE consultas 
    ADD COLUMN IF NOT EXISTS chat_ativo BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS chat_iniciado_em TIMESTAMP NULL DEFAULT NULL;
