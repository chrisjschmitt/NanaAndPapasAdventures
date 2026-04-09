import { put, list, del } from '@vercel/blob'
import type { PhotoMeta, Puzzle } from '../../src/types'

const PHOTOS_MANIFEST = 'adventures/photos.json'
const PUZZLES_MANIFEST = 'adventures/puzzles.json'

function wrapError(step: string, err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err)
  throw new Error(`[${step}] ${msg}`)
}

// --- Photos manifest ---

export async function getPhotosManifest(): Promise<PhotoMeta[]> {
  try {
    const { blobs } = await list({ prefix: PHOTOS_MANIFEST })
    if (blobs.length === 0) return []
    const url = `${blobs[0].url}?t=${Date.now()}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export async function savePhotosManifest(photos: PhotoMeta[]): Promise<void> {
  try {
    await put(PHOTOS_MANIFEST, JSON.stringify(photos, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    })
  } catch (err) {
    wrapError('photos-manifest-save', err)
  }
}

// --- Puzzles manifest ---

export async function getPuzzlesManifest(): Promise<Puzzle[]> {
  try {
    const { blobs } = await list({ prefix: PUZZLES_MANIFEST })
    if (blobs.length === 0) return []
    const url = `${blobs[0].url}?t=${Date.now()}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export async function savePuzzlesManifest(puzzles: Puzzle[]): Promise<void> {
  try {
    await put(PUZZLES_MANIFEST, JSON.stringify(puzzles, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    })
  } catch (err) {
    wrapError('puzzles-manifest-save', err)
  }
}

// --- Image upload / delete ---

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  avif: 'image/avif',
}

function resolveContentType(fileName: string, fileType: string): string {
  if (fileType && fileType !== 'application/octet-stream') return fileType
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  return MIME_MAP[ext] || 'application/octet-stream'
}

export async function uploadImage(file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  const key = `adventures/images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const contentType = resolveContentType(file.name, file.type)

  try {
    const blob = await put(key, file, { access: 'public', contentType })
    return blob.url
  } catch (err) {
    wrapError(`image-upload: ${file.name}`, err)
  }
}

export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    await del(imageUrl)
  } catch {
    // may already be deleted
  }
}
