const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_vI3GflRJK8VQ@ep-damp-bread-azmjs8jb.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
  });
  await client.connect();
  const res = await client.query('SELECT * FROM "StockMovement" ORDER BY timestamp DESC LIMIT 20');
  console.table(res.rows);
  await client.end();
}

run();
