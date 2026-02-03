import mysql from 'mysql2/promise';
import * as fs from 'fs';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const sql = fs.readFileSync('./drizzle/0005_silly_mac_gargan.sql', 'utf-8');
// Remove statement-breakpoint comments
const cleanSql = sql.replace(/--> statement-breakpoint\n/g, '');
const statements = cleanSql.split(';').filter(s => s.trim().length > 0);

console.log(`Applying ${statements.length} SQL statements...`);

for (const statement of statements) {
  try {
    await connection.query(statement);
    console.log('✓ Statement executed');
  } catch (error) {
    console.error('✗ Error:', error.message.substring(0, 100));
  }
}

await connection.end();
console.log('Done!');
