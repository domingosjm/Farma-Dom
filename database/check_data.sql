-- Verificar se há pacotes cadastrados
SELECT 'PACOTES' as tabela, COUNT(*) as total FROM pacotes_saude;
SELECT * FROM pacotes_saude;

-- Verificar se há usuários
SELECT 'USUARIOS' as tabela, COUNT(*) as total FROM usuarios WHERE tipo_usuario = 'paciente';

-- Verificar se há assinaturas
SELECT 'ASSINATURAS' as tabela, COUNT(*) as total FROM assinaturas_pacotes;
SELECT a.*, u.email, p.nome as pacote_nome 
FROM assinaturas_pacotes a 
LEFT JOIN usuarios u ON a.usuario_id = u.id
LEFT JOIN pacotes_saude p ON a.pacote_id = p.id;
