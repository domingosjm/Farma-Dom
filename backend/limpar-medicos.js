const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'farmadom'
  });

  await conn.execute('DELETE FROM usuarios WHERE tipo_usuario = "medico"');
  console.log('Usuários médicos removidos');
  
  await conn.end();
})();
