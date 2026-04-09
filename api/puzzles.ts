import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyRequest, unauthorizedResponse, jsonResponse } from './lib/auth'
import { getPuzzlesManifest, savePuzzlesManifest } from './lib/blob-storage'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const puzzles = await getPuzzlesManifest()
    const r = jsonResponse(puzzles)
    res.status(r.status)
    r.headers.forEach((v, k) => res.setHeader(k, v))
    return res.json(await r.json())
  }

  const asRequest = new Request('http://localhost', {
    headers: req.headers as unknown as HeadersInit,
  })
  if (!verifyRequest(asRequest)) {
    const u = unauthorizedResponse()
    return res.status(u.status).json(await u.json())
  }

  if (req.method === 'POST') {
    const puzzle = req.body
    if (!puzzle || !puzzle.id) {
      return res.status(400).json({ error: 'Puzzle data required' })
    }
    const puzzles = await getPuzzlesManifest()
    puzzles.push(puzzle)
    await savePuzzlesManifest(puzzles)
    return res.json(puzzle)
  }

  if (req.method === 'PUT') {
    const update = req.body
    if (!update || !update.id) {
      return res.status(400).json({ error: 'Puzzle id required' })
    }
    const puzzles = await getPuzzlesManifest()
    const updated = puzzles.map((p) => (p.id === update.id ? { ...p, ...update } : p))
    await savePuzzlesManifest(updated)
    return res.json({ ok: true })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'Puzzle id required' })
    const puzzles = await getPuzzlesManifest()
    const updated = puzzles.filter((p) => p.id !== id)
    await savePuzzlesManifest(updated)
    return res.json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
