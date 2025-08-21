const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI || 'mongodb+srv://bhadresh:Bhadresh984@stacks.wgww0iq.mongodb.net/'

let client
let db
let collections = {}

async function connect() {
  if (db) return { db, collections }
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })
  await client.connect()
  db = client.db('stacks')
  collections.users = db.collection('users')
  collections.games = db.collection('games')
  collections.bets = db.collection('bets')
  collections.ledger = db.collection('ledger')
  collections.game_sessions = db.collection('game_sessions')
  await Promise.all([
    collections.users.createIndex({ fid: 1 }, { unique: true }),
    collections.bets.createIndex({ gameNumber: 1 }),
    collections.games.createIndex({ gameNumber: 1 }, { unique: true }),
    collections.ledger.createIndex({ fid: 1, createdAt: -1 }),
    collections.game_sessions.createIndex({ 'players.fid': 1, createdAt: -1 }),
    collections.game_sessions.createIndex({ gameNumber: 1 }),
  ])
  return { db, collections }
}

async function close() {
  if (client) await client.close()
  db = null
  collections = {}
}

module.exports = { connect, close } 