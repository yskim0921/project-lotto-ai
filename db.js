// db.js
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
let db;

async function connectDB() {
  if (db) return db; // 이미 연결되어 있으면 재사용
  try {
    await client.connect();
    db = client.db('lotto');
    console.log('✅ MongoDB 연결 성공');
    return db;
  } catch (err) {
    console.error('❌ MongoDB 연결 실패', err);
    process.exit(1);
  }
}

module.exports = { connectDB };
