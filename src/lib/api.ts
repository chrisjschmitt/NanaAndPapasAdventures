import type { PhotoMeta, Puzzle } from '../types'

function getToken(): string | null {
  return sessionStorage.getItem('admin_token')
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { 'x-admin-token': token } : {}
}

// --- Auth ---

export async function login(password: string): Promise<string> {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login failed')
  sessionStorage.setItem('admin_token', data.token)
  return data.token
}

export function logout(): void {
  sessionStorage.removeItem('admin_token')
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

// --- Photos ---

export async function fetchPhotos(): Promise<PhotoMeta[]> {
  const res = await fetch('/api/photos', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load photos')
  return res.json()
}

export async function savePhotosManifest(photos: PhotoMeta[]): Promise<void> {
  const res = await fetch('/api/photos', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(photos),
  })
  if (!res.ok) throw new Error('Failed to save photos')
}

export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/upload-image', {
    method: 'POST',
    body: fd,
    headers: authHeaders(),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data.url
}

export async function deletePhoto(id: string, url: string): Promise<void> {
  const res = await fetch('/api/photos', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ id, url }),
  })
  if (!res.ok) throw new Error('Failed to delete photo')
}

// --- Puzzles ---

export async function fetchPuzzles(): Promise<Puzzle[]> {
  const res = await fetch('/api/puzzles', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load puzzles')
  return res.json()
}

export async function createPuzzle(puzzle: Puzzle): Promise<Puzzle> {
  const res = await fetch('/api/puzzles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(puzzle),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to create puzzle')
  return data
}

export async function updatePuzzle(puzzle: Partial<Puzzle> & { id: string }): Promise<void> {
  const res = await fetch('/api/puzzles', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(puzzle),
  })
  if (!res.ok) throw new Error('Failed to update puzzle')
}

export async function deletePuzzleApi(id: string): Promise<void> {
  const res = await fetch('/api/puzzles', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ id }),
  })
  if (!res.ok) throw new Error('Failed to delete puzzle')
}
