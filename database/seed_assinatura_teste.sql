-- Script para criar assinatura de teste
-- Primeiro, vamos buscar um usuário e um pacote para criar a assinatura

-- Criar assinatura ativa para um usuário de teste
-- Substitua o usuario_id pelo ID real do seu usuário
INSERT INTO assinaturas_pacotes (
    id,
    usuario_id,
    pacote_id,
    data_inicio,
    data_fim,
    status,
    valor_pago,
    metodo_pagamento,
    proxima_cobranca
)
SELECT 
    UUID(),
    u.id as usuario_id,
    p.id as pacote_id,
    NOW() as data_inicio,
    DATE_ADD(NOW(), INTERVAL 1 MONTH) as data_fim,
    'ativa' as status,
    p.preco_mensal as valor_pago,
    'cartao' as metodo_pagamento,
    DATE_ADD(NOW(), INTERVAL 1 MONTH) as proxima_cobranca
FROM usuarios u
CROSS JOIN pacotes_saude p
WHERE u.tipo_usuario = 'paciente'
  AND p.tipo = 'individual'
  AND NOT EXISTS (
    SELECT 1 FROM assinaturas_pacotes a 
    WHERE a.usuario_id = u.id AND a.status = 'ativa'
  )
LIMIT 1;

-- Verificar se a assinatura foi criada
SELECT 
    a.*,
    u.nome_completo,
    u.email,
    p.nome as pacote_nome
FROM assinaturas_pacotes a
JOIN usuarios u ON a.usuario_id = u.id
JOIN pacotes_saude p ON a.pacote_id = p.id
WHERE a.status = 'ativa';
