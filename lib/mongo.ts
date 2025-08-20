import { MongoClient, Db, Collection } from 'mongodb'

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
  const users = database.collection('users') as Collection<any>
  const ledger = database.collection('ledger') as Collection<any>
  const games = database.collection('games') as Collection<any>
  const bets = database.collection('bets') as Collection<any>
  return { users, ledger, games, bets }
} 