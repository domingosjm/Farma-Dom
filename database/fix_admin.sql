-- Script para corrigir/criar o usuário admin
-- Execute no MySQL: mysql -u root -p farmadom < database/fix_admin.sql

USE farmadom;

-- Atualizar a senha do admin se ele já existir
UPDATE usuarios 
SET senha_hash = '$2a$10$84vdjamh9YJ4bN2j7ztvWOmU8/OeH0XODqOUk37CZ5rBOWlofo2uC',
    status_conta = 'ativo',
    is_ativo = true
WHERE email = 'admin@farmadom.ao';

-- Se não existir, criar
INSERT IGNORE INTO usuarios (nome_completo, email, senha_hash, tipo_usuario, status_conta, is_ativo)
VALUES (
    'Administrador FarmaDom',
    'admin@farmadom.ao',
    '$2a$10$84vdjamh9YJ4bN2j7ztvWOmU8/OeH0XODqOUk37CZ5rBOWlofo2uC',
    'admin',
    'ativo',
    true
);

-- Verificar
SELECT id, nome_completo, email, tipo_usuario, status_conta FROM usuarios WHERE email = 'admin@farmadom.ao';
