import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put, list } from '@vercel/blob'

const PUZZLES_MANIFEST = 'adventures/puzzles.json'

function verifyToken(req: VercelRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false
  const token = req.headers['x-admin-token']
  if (!token || typeof token !== 'string') return false
  try {
    const decoded = Buffer.from(token, 'base64').toString()
    return decoded === `nana:${adminPassword}`
  } catch { return false }
}

async function getManifest(): Promise<unknown[]> {
  try {
    const { blobs } = await list({ prefix: PUZZLES_MANIFEST })
    if (blobs.length === 0) return []
    const url = `${blobs[0].url}?t=${Date.now()}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    return await res.json()
  } catch { return [] }
}

async function saveManifest(data: unknown[]): Promise<void> {
  await put(PUZZLES_MANIFEST, JSON.stringify(data, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')

  if (req.method === 'GET') {
    const puzzles = await getManifest()
    return res.json(puzzles)
  }

  if (!verifyToken(req)) return res.status(401).json({ error: 'Unauthorized' })

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { return res.status(400).json({ error: 'Invalid JSON' }) }
  }

  if (req.method === 'POST') {
    if (!body?.id) return res.status(400).json({ error: 'Puzzle data required' })
    const puzzles = await getManifest()
    puzzles.push(body)
    await saveManifest(puzzles)
    return res.json(body)
  }

  if (req.method === 'PUT') {
    if (!body?.id) return res.status(400).json({ error: 'Puzzle id required' })
    const puzzles = await getManifest() as { id: string }[]
    const updated = puzzles.map((p) => (p.id === body.id ? { ...p, ...body } : p))
    await saveManifest(updated)
    return res.json({ ok: true })
  }

  if (req.method === 'DELETE') {
    if (!body?.id) return res.status(400).json({ error: 'Puzzle id required' })
    const puzzles = await getManifest() as { id: string }[]
    await saveManifest(puzzles.filter((p) => p.id !== body.id))
    return res.json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
