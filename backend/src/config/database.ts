import mysql from 'mysql2/promise';
import config from './env';

// ============================================
// Pool de conexões MySQL Local
// ============================================
export const pool = mysql.createPool({
  host: config.MYSQL_HOST,
  port: config.MYSQL_PORT,
  user: config.MYSQL_USER,
  password: config.MYSQL_PASSWORD,
  database: config.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Tipo para resultados de query
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

// Interface para cliente de transação (compatível com API anterior)
export interface TransactionClient {
  query: <T = any>(text: string, params?: any[]) => Promise<QueryResult<T>>;
}

// Helper para queries tipadas (compatível com a API anterior)
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  // Converter placeholders $1, $2... para ? (MySQL usa ?)
  const mysqlQuery = text.replace(/\$(\d+)/g, '?');
  const [rows] = await pool.query(mysqlQuery, params);
  return {
    rows: rows as T[],
    rowCount: Array.isArray(rows) ? rows.length : 0,
  };
}

// Helper para transações (com cliente compatível)
export async function withTransaction<T>(
  callback: (client: TransactionClient) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  
  // Criar wrapper que retorna formato compatível
  const client: TransactionClient = {
    query: async <R = any>(text: string, params?: any[]): Promise<QueryResult<R>> => {
      const mysqlQuery = text.replace(/\$(\d+)/g, '?');
      const [rows] = await connection.query(mysqlQuery, params);
      return {
        rows: rows as R[],
        rowCount: Array.isArray(rows) ? rows.length : 0,
      };
    }
  };
  
  try {
    await connection.beginTransaction();
    const result = await callback(client);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Testar conexão (MySQL Local)
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT DATABASE() as db, USER() as user, VERSION() as version');
    const result = (rows as any[])[0];
    console.log('✅ Conectado ao MySQL Local');
    console.log(`   Database: ${result.db}`);
    console.log(`   User: ${result.user}`);
    console.log(`   Version: ${result.version}`);
    connection.release();
    return true;
  } catch (error: any) {
    console.error('❌ Erro ao conectar ao MySQL:');
    console.error(`   ${error.message}`);
    console.error('   Verifique se:');
    console.error('   - O servidor MySQL está rodando');
    console.error('   - As credenciais no .env estão corretas');
    console.error('   - O banco de dados "farmadom" foi criado');
    return false;
  }
}

export default pool;
