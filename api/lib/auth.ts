const TOKEN_HEADER = 'x-admin-token'

export function createToken(password: string): string {
  return Buffer.from(`nana:${password}`).toString('base64')
}

export function checkPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false
  return password === adminPassword
}

export function verifyRequest(request: Request): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false

  const token = request.headers.get(TOKEN_HEADER)
  if (!token) return false

  try {
    const decoded = Buffer.from(token, 'base64').toString()
    return decoded === `nana:${adminPassword}`
  } catch {
    return false
  }
}

export function unauthorizedResponse(): Response {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}

export function jsonResponse(data: unknown): Response {
  return Response.json(data, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
    },
  })
}
