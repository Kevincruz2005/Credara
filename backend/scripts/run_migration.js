require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'fix_schema.sql'), 'utf-8');
    console.log('Executing query:');
    console.log(sql);
    const result = await pool.query(sql);
    console.log('Query executed successfully.', result.command);
  } catch (err) {
    console.error('Error executing query:', err.message);
  } finally {
    await pool.end();
  }
}

runMigration();
