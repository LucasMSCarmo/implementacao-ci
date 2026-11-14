import pg from 'pg';

export function createPool(): pg.Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Variável DATABASE_URL não definida');
  return new pg.Pool({ connectionString });
}
