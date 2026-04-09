import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyRequest, unauthorizedResponse, jsonResponse } from './lib/auth'
import {
  getPhotosManifest,
  savePhotosManifest,
  deleteImage,
} from './lib/blob-storage'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const photos = await getPhotosManifest()
    const r = jsonResponse(photos)
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

  if (req.method === 'PUT') {
    const photos = req.body
    if (!Array.isArray(photos)) {
      return res.status(400).json({ error: 'Expected array of photos' })
    }
    await savePhotosManifest(photos)
    return res.json({ ok: true })
  }

  if (req.method === 'DELETE') {
    const { id, url } = req.body
    if (url) {
      await deleteImage(url)
    }
    if (id) {
      const photos = await getPhotosManifest()
      const updated = photos.filter((p) => p.id !== id)
      await savePhotosManifest(updated)
    }
    return res.json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
