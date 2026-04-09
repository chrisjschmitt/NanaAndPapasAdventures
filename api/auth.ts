import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD not configured.' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { return res.status(400).json({ error: 'Invalid JSON' }) }
  }

  const password = body?.password
  if (!password || password !== adminPassword) {
    return res.status(401).json({ error: 'Incorrect password.' })
  }

  const token = Buffer.from(`nana:${password}`).toString('base64')
  return res.json({ token })
}
