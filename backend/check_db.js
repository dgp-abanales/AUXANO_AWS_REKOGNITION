// Simple DB checker — run with `node check_db.js`
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'rekognition_db';

  try {
    const conn = await mysql.createConnection({ host, port, user, password, database });
    const [db] = await conn.query('SELECT DATABASE() AS db');
    console.log('Connected to database:', db[0].db);

    const [tables] = await conn.query("SHOW TABLES");
    console.log('Tables:', tables.map(r => Object.values(r)[0]));

    const [exists] = await conn.query("SHOW TABLES LIKE 'users'");
    if (!exists.length) {
      console.warn('Table `users` not found in database.');
    } else {
      const [count] = await conn.query('SELECT COUNT(*) AS total FROM users');
      console.log('users count:', count[0].total);
      const [sample] = await conn.query('SELECT id, fullName, employeeId, email, enrolledAt FROM users LIMIT 10');
      console.table(sample);
    }

    await conn.end();
  } catch (err) {
    console.error('DB check failed:', err.message || err);
    process.exitCode = 1;
  }
})();
