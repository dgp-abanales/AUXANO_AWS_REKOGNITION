import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'rekognition_db';

  console.log(`Connecting to ${host}:${port} as ${user}`);

  const conn = await mysql.createConnection({ host, port, user, password, multipleStatements: true });

  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`Database \`${dbName}\` is ready`);

    await conn.changeUser({ database: dbName });

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        fullName VARCHAR(255) NOT NULL,
        employeeId VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        faceIds JSON NOT NULL,
        poses JSON NOT NULL,
        enrolledAt VARCHAR(50) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Table `users` created or already exists');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('DB setup failed:', err.message || err);
  process.exit(1);
});
