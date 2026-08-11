const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to database');
    let sql = fs.readFileSync('schema.sql', 'utf16le');
    if (sql.charCodeAt(0) === 0xFEFF) {
      sql = sql.slice(1);
    }
    const statements = sql.split(';').filter(stmt => stmt.trim() !== '');
    for (const stmt of statements) {
      console.log('Executing:', stmt.substring(0, 50).replace(/\n/g, ' ') + '...');
      await client.query(stmt);
    }
    console.log('Schema executed successfully');
  } catch (err) {
    console.error('Error executing schema:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
