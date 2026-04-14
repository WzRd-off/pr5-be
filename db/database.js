const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const dbExists = fs.existsSync(dbPath);
const db = new Database(dbPath);

if (!dbExists) {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('База инициализирована по схеме.');
}

module.exports = db 