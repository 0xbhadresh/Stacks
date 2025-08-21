import { NextRequest } from 'next/server'
import { getCollections } from '@/lib/mongo'

interface ChipsRequestBody {
  fid?: string | number
  amount?: string | number
  op?: string
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as ChipsRequestBody
  const fid = String(body.fid || '')
  const amount = Number(body.amount || 0)
  const op = String(body.op || '') // 'add' | 'sub'
  if (!fid || !amount || (op !== 'add' && op !== 'sub')) return new Response(JSON.stringify({ error: 'bad request' }), { status: 400 })
  const { users, ledger } = await getCollections()
  const user = await users.findOne({ fid })
  if (!user) return new Response(JSON.stringify({ error: 'user not found' }), { status: 404 })
  if (op === 'sub' && user.chips < amount) return new Response(JSON.stringify({ error: 'insufficient' }), { status: 400 })
  const inc = op === 'add' ? amount : -amount
  await users.updateOne({ fid }, { $inc: { chips: inc }, $set: { updatedAt: new Date() } })
  await ledger.insertOne({ fid, type: op === 'add' ? 'credit' : 'debit', amount, reason: 'api', createdAt: new Date() })
  const updated = await users.findOne({ fid })
  return Response.json({ fid, chips: updated?.chips ?? 0 })
} 