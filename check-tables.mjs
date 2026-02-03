import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.query("SHOW TABLES");
const tableNames = rows.map(r => Object.values(r)[0]);
console.log('All tables:', tableNames.join(', '));
const newTables = tableNames.filter(t => t.includes('email') || t.includes('automation'));
console.log('New tables:', newTables.join(', '));
await connection.end();
