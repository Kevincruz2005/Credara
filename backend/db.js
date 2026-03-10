const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Supabase
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('[DB] Connection error:', err.message);
  } else {
    console.log('[DB] Connected to Supabase PostgreSQL');
    release();
  }
});

module.exports = pool;
