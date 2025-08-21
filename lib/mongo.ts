import { MongoClient, Db, Collection, Document } from 'mongodb'

const uri = process.env.MONGODB_URI || ''

let client: MongoClient | null = null
let db: Db | null = null

export async function getDb() {
  if (db) return db
  if (!uri) throw new Error('MONGODB_URI not set')
  client = new MongoClient(uri)
  await client.connect()
  db = client.db('stacks')
  return db
}

export async function getCollections() {
  const database = await getDb()
  const users = database.collection('users') as Collection<Document>
  const ledger = database.collection('ledger') as Collection<Document>
  const games = database.collection('games') as Collection<Document>
  const bets = database.collection('bets') as Collection<Document>
  return { users, ledger, games, bets }
} 