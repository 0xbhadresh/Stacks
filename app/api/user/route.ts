import { NextRequest } from 'next/server'
import { getCollections } from '@/lib/mongo'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const fid = searchParams.get('fid')
  if (!fid) return new Response(JSON.stringify({ error: 'fid required' }), { status: 400 })
  const { users } = await getCollections()
  const user = await users.findOne({ fid: String(fid) })
  if (!user) return new Response(JSON.stringify({ error: 'not found' }), { status: 404 })
  return Response.json({ fid: user.fid, chips: user.chips, username: user.username, displayName: user.displayName, pfpUrl: user.pfpUrl, bio: user.bio, location: user.location, isFarcaster: !!user.isFarcaster })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as any
  const fid = String(body.fid || '')
  if (!fid) return new Response(JSON.stringify({ error: 'fid required' }), { status: 400 })
  const { users } = await getCollections()
  const isFarcaster = /^\d+$/.test(fid)
  const existing = await users.findOne({ fid })
  if (existing) return Response.json({ fid: existing.fid, chips: existing.chips })
  const now = new Date()
  await users.insertOne({ fid, chips: isFarcaster ? 1000 : 0, isFarcaster, username: body.username, displayName: body.displayName, pfpUrl: body.pfpUrl, bio: body.bio, location: body.location, createdAt: now, updatedAt: now })
  return Response.json({ fid, chips: isFarcaster ? 1000 : 0 })
} 