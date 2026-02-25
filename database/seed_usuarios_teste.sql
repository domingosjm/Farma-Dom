-- ============================================
-- FARMADOM - USUÁRIOS DE TESTE
-- Execute este script para adicionar usuários de teste
-- Senha padrão: teste123
-- ============================================

USE farmadom;

-- ============================================
-- ENTIDADES DE TESTE
-- ============================================

-- Farmácia de teste
INSERT IGNORE INTO farmacias (id, nome, endereco, cidade, provincia, zona, telefone, email, licenca, is_online, is_ativa, aprovada) VALUES
('f1000000-0000-0000-0000-000000000001', 'Farmácia Teste Central', 'Rua da Missão, 123', 'Luanda', 'Luanda', 'Ingombota', '923456789', 'farmacia@teste.ao', 'LIC-FARM-001', true, true, true),
('f1000000-0000-0000-0000-000000000002', 'Farmácia Saúde Total', 'Av. Brasil, 456', 'Luanda', 'Luanda', 'Miramar', '924567890', 'saudetotal@teste.ao', 'LIC-FARM-002', true, true, true);

-- Hospital de teste
INSERT IGNORE INTO hospitais (id, nome, endereco, cidade, provincia, telefone, email, licenca, tipo, especialidades, aprovada) VALUES
('h1000000-0000-0000-0000-000000000001', 'Hospital Teste Saúde', 'Av. 4 de Fevereiro, 789', 'Luanda', 'Luanda', '925678901', 'hospital@teste.ao', 'LIC-HOSP-001', 'Geral', JSON_ARRAY('Clínica Geral', 'Pediatria', 'Cardiologia', 'Ortopedia'), true);

-- Empresa de transporte de teste
INSERT IGNORE INTO empresas_transporte (id, nome, endereco, cidade, provincia, telefone, email, cnpj, aprovada) VALUES
('t1000000-0000-0000-0000-000000000001', 'TransMed Express', 'Rua Comandante Stona, 321', 'Luanda', 'Luanda', '926789012', 'transmed@teste.ao', '123456789', true);

-- ============================================
-- USUÁRIOS DE TESTE
-- Senha padrão: teste123
-- Hash: $2a$10$65PEbdLOH7fJEEwdWvK3fe7LCjGmiWwfG.SAuHmvn.i8kkvZ3hyaK
-- ============================================

-- Paciente de teste
INSERT IGNORE INTO usuarios (id, nome_completo, email, telefone, senha_hash, tipo_usuario, status_conta, is_ativo, cidade, provincia) VALUES
('u1000000-0000-0000-0000-000000000001', 'João Paciente Silva', 'paciente@teste.ao', '921111111', '$2a$10$65PEbdLOH7fJEEwdWvK3fe7LCjGmiWwfG.SAuHmvn.i8kkvZ3hyaK', 'paciente', 'ativo', true, 'Luanda', 'Luanda');

-- Médico de teste
INSERT IGNORE INTO usuarios (id, nome_completo, email, telefone, senha_hash, tipo_usuario, status_conta, is_ativo, cidade, provincia, entidade_id, entidade_tipo) VALUES
('u1000000-0000-0000-0000-000000000002', 'Dr. Manuel Médico Santos', 'medico@teste.ao', '922222222', '$2a$10$65PEbdLOH7fJEEwdWvK3fe7LCjGmiWwfG.SAuHmvn.i8kkvZ3hyaK', 'medico', 'ativo', true, 'Luanda', 'Luanda', 'h1000000-0000-0000-0000-000000000001', 'hospital');

-- Enfermeiro de teste
INSERT IGNORE INTO usuarios (id, nome_completo, email, telefone, senha_hash, tipo_usuario, status_conta, is_ativo, cidade, provincia, entidade_id, entidade_tipo) VALUES
('u1000000-0000-0000-0000-000000000003', 'Ana Enfermeira Costa', 'enfermeiro@teste.ao', '923333333', '$2a$10$65PEbdLOH7fJEEwdWvK3fe7LCjGmiWwfG.SAuHmvn.i8kkvZ3hyaK', 'enfermeiro', 'ativo', true, 'Luanda', 'Luanda', 'h1000000-0000-0000-0000-000000000001', 'hospital');

-- Admin de Farmácia
INSERT IGNORE INTO usuarios (id, nome_completo, email, telefone, senha_hash, tipo_usuario, status_conta, is_ativo, cidade, provincia, entidade_id, entidade_tipo) VALUES
('u1000000-0000-0000-0000-000000000004', 'Pedro Farmácia Admin', 'farmacia.admin@teste.ao', '924444444', '$2a$10$65PEbdLOH7fJEEwdWvK3fe7LCjGmiWwfG.SAuHmvn.i8kkvZ3hyaK', 'farmacia_admin', 'ativo', true, 'Luanda', 'Luanda', 'f1000000-0000-0000-0000-000000000001', 'farmacia');

-- Funcionário de Farmácia
INSERT IGNORE INTO usuarios (id, nome_completo, email, telefone, senha_hash, tipo_usuario, status_conta, is_ativo, cidade, provincia, entidade_id, entidade_tipo) VALUES
('u1000000-0000-0000-0000-000000000005', 'Maria Farmácia Func', 'farmacia.func@teste.ao', '925555555', '$2a$10$65PEbdLOH7fJEEwdWvK3fe7LCjGmiWwfG.SAuHmvn.i8kkvZ3hyaK', 'farmacia_funcionario', 'ativo', true, 'Luanda', 'Luanda', 'f1000000-0000-0000-0000-000000000001', 'farmacia');

-- Farmacêutico
INSERT IGNORE INTO usuarios (id, nome_completo, email, telefone, senha_hash, tipo_usuario, status_conta, is_ativo, cidade, provincia, entidade_id, entidade_tipo) VALUES
('u1000000-0000-0000-0000-000000000006', 'Carlos Farmacêutico Lima', 'farmaceutico@teste.ao', '926666666', '$2a$10$65PEbdLOH7fJEEwdWvK3fe7LCjGmiWwfG.SAuHmvn.i8kkvZ3hyaK', 'farmaceutico', 'ativo', true, 'Luanda', 'Luanda', 'f1000000-0000-0000-0000-000000000001', 'farmacia');

-- Gerente de Hospital
INSERT IGNORE INTO usuarios (id, nome_completo, email, telefone, senha_hash, tipo_usuario, status_conta, is_ativo, cidade, provincia, entidade_id, entidade_tipo) VALUES
('u1000000-0000-0000-0000-000000000007', 'Sofia Hospital Gerente', 'hospital.gerente@teste.ao', '927777777', '$2a$10$65PEbdLOH7fJEEwdWvK3fe7LCjGmiWwfG.SAuHmvn.i8kkvZ3hyaK', 'hospital_gerente', 'ativo', true, 'Luanda', 'Luanda', 'h1000000-0000-0000-0000-000000000001', 'hospital');

-- Gerente de Transporte
INSERT IGNORE INTO usuarios (id, nome_completo, email, telefone, senha_hash, tipo_usuario, status_conta, is_ativo, cidade, provincia, entidade_id, entidade_tipo) VALUES
('u1000000-0000-0000-0000-000000000008', 'Ricardo Transporte Gerente', 'transporte.gerente@teste.ao', '928888888', '$2a$10$65PEbdLOH7fJEEwdWvK3fe7LCjGmiWwfG.SAuHmvn.i8kkvZ3hyaK', 'transporte_gerente', 'ativo', true, 'Luanda', 'Luanda', 't1000000-0000-0000-0000-000000000001', 'empresa_transporte');

-- Motorista
INSERT IGNORE INTO usuarios (id, nome_completo, email, telefone, senha_hash, tipo_usuario, status_conta, is_ativo, cidade, provincia, entidade_id, entidade_tipo) VALUES
('u1000000-0000-0000-0000-000000000009', 'António Motorista Neves', 'motorista@teste.ao', '929999999', '$2a$10$65PEbdLOH7fJEEwdWvK3fe7LCjGmiWwfG.SAuHmvn.i8kkvZ3hyaK', 'motorista', 'ativo', true, 'Luanda', 'Luanda', 't1000000-0000-0000-0000-000000000001', 'empresa_transporte');

-- Entregador
INSERT IGNORE INTO usuarios (id, nome_completo, email, telefone, senha_hash, tipo_usuario, status_conta, is_ativo, cidade, provincia, entidade_id, entidade_tipo) VALUES
('u1000000-0000-0000-0000-000000000010', 'Bruno Entregador Dias', 'entregador@teste.ao', '920000000', '$2a$10$65PEbdLOH7fJEEwdWvK3fe7LCjGmiWwfG.SAuHmvn.i8kkvZ3hyaK', 'entregador', 'ativo', true, 'Luanda', 'Luanda', 't1000000-0000-0000-0000-000000000001', 'empresa_transporte');

-- ============================================
-- PROFISSIONAIS DE SAÚDE (Médicos e Enfermeiros)
-- ============================================
INSERT IGNORE INTO profissionais_saude (usuario_id, especialidade, numero_ordem, anos_experiencia, biografia, atende_domicilio, atende_online, valor_consulta_online, valor_consulta_domicilio, disponivel, hospital_id) VALUES
('u1000000-0000-0000-0000-000000000002', 'Clínica Geral', 'OM-12345', 10, 'Médico experiente com especialização em medicina familiar. Formado pela Universidade Agostinho Neto.', true, true, 5000.00, 8000.00, true, 'h1000000-0000-0000-0000-000000000001'),
('u1000000-0000-0000-0000-000000000003', 'Enfermagem Geral', 'OE-54321', 5, 'Enfermeira dedicada com experiência em cuidados domiciliares.', true, false, NULL, 3000.00, true, 'h1000000-0000-0000-0000-000000000001');

-- ============================================
-- VEÍCULOS DE TESTE
-- ============================================
INSERT IGNORE INTO veiculos (empresa_id, placa, modelo, tipo, capacidade_kg, is_ativo) VALUES
('t1000000-0000-0000-0000-000000000001', 'LAD-123-AB', 'Toyota Hilux', 'Pickup', 500.00, true),
('t1000000-0000-0000-0000-000000000001', 'LAD-456-CD', 'Honda CG 160', 'Moto', 20.00, true);

-- ============================================
-- ESTOQUE DE TESTE PARA FARMÁCIA
-- ============================================
INSERT IGNORE INTO farmacia_estoque (farmacia_id, medicamento_id, quantidade, preco_farmacia)
SELECT 'f1000000-0000-0000-0000-000000000001', id, FLOOR(RAND() * 50) + 10, preco * 1.1
FROM medicamentos;

-- ============================================
-- RESUMO DOS USUÁRIOS CRIADOS
-- ============================================
SELECT 'Usuários de teste criados com sucesso!' as status;
SELECT '============================================' as '---';
SELECT 'CREDENCIAIS DE ACESSO (Senha: teste123)' as info;
SELECT '============================================' as '---';

SELECT tipo_usuario as 'Tipo', email as 'Email', nome_completo as 'Nome'
FROM usuarios 
WHERE email LIKE '%@teste.ao'
ORDER BY tipo_usuario;
