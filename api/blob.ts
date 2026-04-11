import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Readable } from 'node:stream'
import { get } from '@vercel/blob'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const pathname = req.query.pathname as string
  if (!pathname) return res.status(400).json({ error: 'Missing pathname' })

  try {
    const result = await get(pathname, {
      access: 'private',
      ifNoneMatch: (req.headers['if-none-match'] as string) ?? undefined,
    })

    if (!result) return res.status(404).send('Not found')

    if (result.statusCode === 304) {
      res.setHeader('ETag', result.blob.etag)
      res.setHeader('Cache-Control', 'private, no-cache')
      return res.status(304).end()
    }

    res.setHeader('Content-Type', result.blob.contentType)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('ETag', result.blob.etag)
    res.setHeader('Cache-Control', 'private, no-cache')
    // @ts-expect-error ReadableStream is compatible with web stream
    Readable.fromWeb(result.stream).pipe(res)
  } catch {
    return res.status(404).send('Not found')
  }
}
