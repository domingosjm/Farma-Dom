import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/farmadom';

async function migrate() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('🔄 Iniciando migração...');
    console.log(`📍 Database: ${DATABASE_URL.replace(/:[^:@]+@/, ':***@')}`);

    // Ensure _migrations table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Read migration files
    const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.error(`❌ Diretório de migrações não encontrado: ${migrationsDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('ℹ️  Nenhuma migração encontrada.');
      return;
    }

    // Get already executed migrations
    const executed = await pool.query('SELECT filename FROM _migrations');
    const executedSet = new Set(executed.rows.map((r: any) => r.filename));

    let applied = 0;

    for (const file of files) {
      if (executedSet.has(file)) {
        console.log(`⏭️  ${file} (já executada)`);
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`▶️  Executando: ${file}...`);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO _migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✅ ${file} aplicada com sucesso`);
        applied++;
      } catch (error: any) {
        await client.query('ROLLBACK');
        console.error(`❌ Erro ao executar ${file}:`, error.message);
        throw error;
      } finally {
        client.release();
      }
    }

    if (applied === 0) {
      console.log('\n✅ Banco de dados já está atualizado!');
    } else {
      console.log(`\n✅ ${applied} migração(ões) aplicada(s) com sucesso!`);
    }
  } catch (error) {
    console.error('❌ Migração falhou:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
