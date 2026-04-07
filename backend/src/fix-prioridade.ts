import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'helpdesk',
  password: 'helpdesk123',
  database: 'helpdesk_dev',
});

async function fix() {
  // Set "prioridade": "média" for all tickets missing it
  const query = `
    UPDATE ticket
    SET "fieldValues" = jsonb_set(
      COALESCE("fieldValues", '{}'::jsonb),
      '{prioridade}',
      '"media"'
    )
    WHERE "fieldValues" IS NULL OR NOT "fieldValues" ? 'prioridade'
  `;
  const result = await pool.query(query);
  console.log('Updated', result.rowCount, 'tickets with default prioridade');

  // Verify
  const check = await pool.query('SELECT id, "fieldValues" FROM ticket LIMIT 3');
  for (const row of check.rows) {
    console.log(`  ${row.id.slice(0, 8)}: prioridade = ${(row.fieldValues as any).prioridade}`);
  }

  pool.end();
}

fix().catch((err) => {
  console.error(err.message);
  pool.end();
  process.exit(1);
});
