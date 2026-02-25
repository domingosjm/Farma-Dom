-- Setup completo para Chat e Videochamadas
-- Execute este script para criar todas as tabelas necessárias

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
    INDEX idx_created_at (created_at),
    INDEX idx_remetente (remetente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para rastrear usuários online
CREATE TABLE IF NOT EXISTS usuarios_online (
    usuario_id CHAR(36) PRIMARY KEY,
    socket_id VARCHAR(255) NOT NULL,
    consulta_id CHAR(36),
    ultima_atividade TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE SET NULL,
    INDEX idx_socket (socket_id),
    INDEX idx_consulta (consulta_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para sinais WebRTC (sinalização de videochamadas)
CREATE TABLE IF NOT EXISTS consultas_signals (
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

-- Adicionar campos nas consultas para suportar chat e vídeo
ALTER TABLE consultas 
    ADD COLUMN IF NOT EXISTS chat_ativo BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS chat_iniciado_em TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS video_ativo BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS video_iniciado_em TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS data_hora_realizada TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS duracao_minutos INT NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS diagnostico TEXT NULL,
    ADD COLUMN IF NOT EXISTS prescricao TEXT NULL,
    ADD COLUMN IF NOT EXISTS observacoes TEXT NULL;

-- Event para limpar sinais antigos (mais de 1 hora)
CREATE EVENT IF NOT EXISTS cleanup_old_signals
ON SCHEDULE EVERY 1 HOUR
DO
  DELETE FROM consultas_signals 
  WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- Verificar se tudo foi criado corretamente
SELECT 'Setup concluído com sucesso!' as status;

-- Listar tabelas criadas
SHOW TABLES LIKE '%chat%';
SHOW TABLES LIKE '%signal%';
SHOW TABLES LIKE '%online%';
