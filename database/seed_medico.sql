-- Criar usuário médico de teste
INSERT INTO usuarios (
    id,
    nome_completo,
    email,
    senha,
    telefone,
    tipo_usuario,
    nif,
    data_nascimento,
    genero,
    endereco_completo,
    cidade,
    provincia,
    is_ativo,
    especialidade,
    numero_ordem,
    anos_experiencia
) VALUES (
    UUID(),
    'Dr. João Santos',
    'medico@farmadom.ao',
    '$2b$10$YourHashedPasswordHere', -- Senha: medico123
    '+244 923 456 789',
    'medico',
    '123456789LA045',
    '1985-05-15',
    'masculino',
    'Rua da Clínica, 123',
    'Luanda',
    'Luanda',
    TRUE,
    'Clínico Geral',
    'OM12345',
    10
);

-- Inserir mais médicos de diferentes especialidades
INSERT INTO usuarios (
    id, nome_completo, email, senha, telefone, tipo_usuario, 
    especialidade, numero_ordem, anos_experiencia, is_ativo
) VALUES 
(
    UUID(),
    'Dra. Maria Costa',
    'maria.costa@farmadom.ao',
    '$2b$10$YourHashedPasswordHere',
    '+244 923 456 790',
    'medico',
    'Pediatria',
    'OM12346',
    8,
    TRUE
),
(
    UUID(),
    'Dr. Pedro Almeida',
    'pedro.almeida@farmadom.ao',
    '$2b$10$YourHashedPasswordHere',
    '+244 923 456 791',
    'medico',
    'Cardiologia',
    'OM12347',
    12,
    TRUE
),
(
    UUID(),
    'Dra. Ana Silva',
    'ana.silva@farmadom.ao',
    '$2b$10$YourHashedPasswordHere',
    '+244 923 456 792',
    'medico',
    'Ginecologia',
    'OM12348',
    7,
    TRUE
);

-- Atualizar senha para bcrypt hash correto (senha: medico123)
-- Execute este comando depois de criar os usuários
UPDATE usuarios 
SET senha = '$2a$10$rZ5QKvMxGpJxhHqGqKqZH.MBK7Y4gVQxE4WGPxNPZqoJxGxNxOxFG'
WHERE email LIKE '%@farmadom.ao' AND tipo_usuario = 'medico';

-- Verificar médicos criados
SELECT id, nome_completo, email, especialidade, numero_ordem 
FROM usuarios 
WHERE tipo_usuario = 'medico';
