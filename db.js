const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234567890dat',
    database: process.env.DB_NAME || 'hotel',
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = pool.promise();