import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'

export const config = {
  api: { bodyParser: false },
}

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

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!verifyToken(req)) return res.status(401).json({ error: 'Unauthorized' })

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN not set.' })
  }

  try {
    const contentType = req.headers['content-type'] || ''
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Expected multipart/form-data' })
    }

    const chunks: Buffer[] = []
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    }
    const body = Buffer.concat(chunks)

    const boundary = contentType.split('boundary=')[1]
    if (!boundary) return res.status(400).json({ error: 'No boundary found' })

    const parts = parseMultipart(body, boundary)
    const filePart = parts.find((p) => p.name === 'file')
    if (!filePart || !filePart.data.length) {
      return res.status(400).json({ error: 'No file provided' })
    }

    const fileName = filePart.filename || 'upload.jpg'
    const ext = (fileName.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const key = `adventures/images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    let ct = filePart.contentType || ''
    if (!ct || ct === 'application/octet-stream') {
      ct = MIME_MAP[ext] || 'application/octet-stream'
    }

    const blob = await put(key, filePart.data, { access: 'public', contentType: ct })
    return res.json({ url: blob.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: message })
  }
}

interface MultipartPart {
  name: string
  filename?: string
  contentType?: string
  data: Buffer
}

function parseMultipart(body: Buffer, boundary: string): MultipartPart[] {
  const parts: MultipartPart[] = []
  const boundaryStr = `--${boundary}`
  const bodyStr = body.toString('binary')
  const segments = bodyStr.split(boundaryStr).slice(1)

  for (const segment of segments) {
    if (segment.startsWith('--')) break
    const headerEnd = segment.indexOf('\r\n\r\n')
    if (headerEnd === -1) continue

    const headerSection = segment.substring(0, headerEnd)
    const dataSection = segment.substring(headerEnd + 4)
    const trimmedData = dataSection.endsWith('\r\n') ? dataSection.slice(0, -2) : dataSection

    const nameMatch = headerSection.match(/name="([^"]+)"/)
    const filenameMatch = headerSection.match(/filename="([^"]+)"/)
    const ctMatch = headerSection.match(/Content-Type:\s*(\S+)/i)

    if (nameMatch) {
      parts.push({
        name: nameMatch[1],
        filename: filenameMatch?.[1],
        contentType: ctMatch?.[1],
        data: Buffer.from(trimmedData, 'binary'),
      })
    }
  }
  return parts
}
