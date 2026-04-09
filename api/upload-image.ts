import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyRequest, unauthorizedResponse } from './lib/auth'
import { uploadImage } from './lib/blob-storage'

export const config = {
  api: { bodyParser: false },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const asRequest = new Request('http://localhost', {
    headers: req.headers as unknown as HeadersInit,
  })
  if (!verifyRequest(asRequest)) {
    const u = unauthorizedResponse()
    return res.status(u.status).json(await u.json())
  }

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

    const file = new File([filePart.data], filePart.filename || 'upload.jpg', {
      type: filePart.contentType || 'application/octet-stream',
    })

    const url = await uploadImage(file)
    return res.json({ url })
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
  const boundaryBuf = Buffer.from(`--${boundary}`)
  const bodyStr = body.toString('binary')
  const boundaryStr = boundaryBuf.toString('binary')

  const segments = bodyStr.split(boundaryStr).slice(1)
  for (const segment of segments) {
    if (segment.startsWith('--')) break
    const headerEnd = segment.indexOf('\r\n\r\n')
    if (headerEnd === -1) continue

    const headerSection = segment.substring(0, headerEnd)
    const dataSection = segment.substring(headerEnd + 4)
    const trimmedData = dataSection.endsWith('\r\n')
      ? dataSection.slice(0, -2)
      : dataSection

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
