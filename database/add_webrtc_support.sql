-- Script para adicionar suporte a videochamadas WebRTC
-- Adicionar tabela de sinalização para WebRTC

-- Verificar se a tabela já existe antes de criar
CREATE TABLE IF NOT EXISTS consultas_signals (
    id VARCHAR(36) PRIMARY KEY,
    consulta_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    signal_type VARCHAR(50) NOT NULL, -- 'offer', 'answer', 'candidate'
    signal_data TEXT NOT NULL, -- JSON com os dados do sinal
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_consulta_user (consulta_id, user_id),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar comentários para documentação
ALTER TABLE consultas_signals COMMENT = 'Armazena sinais WebRTC para sinalização de videochamadas';

-- Criar índice para cleanup de sinais antigos
CREATE INDEX idx_signals_cleanup ON consultas_signals(created_at, consulta_id);

-- Procedure para limpar sinais antigos (mais de 1 hora)
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS cleanup_old_signals()
BEGIN
    DELETE FROM consultas_signals 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);
END$$

DELIMITER ;

-- Event para executar cleanup automaticamente a cada hora
-- (Descomente se o servidor MySQL tiver eventos habilitados)
-- SET GLOBAL event_scheduler = ON;
-- 
-- CREATE EVENT IF NOT EXISTS cleanup_signals_event
-- ON SCHEDULE EVERY 1 HOUR
-- DO CALL cleanup_old_signals();

-- Verificar a criação
SELECT 'Tabela consultas_signals criada com sucesso!' AS status;
DESCRIBE consultas_signals;
