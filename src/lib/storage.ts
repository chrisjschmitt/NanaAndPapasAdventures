import type { Puzzle, Photo } from '../types'

const DB_NAME = 'nana-adventures'
const DB_VERSION = 1
const PUZZLES_STORE = 'puzzles'
const PHOTOS_STORE = 'photos'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(PUZZLES_STORE)) {
        db.createObjectStore(PUZZLES_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        db.createObjectStore(PHOTOS_STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function txGet<T>(store: string, key: string): Promise<T | undefined> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readonly')
        const req = tx.objectStore(store).get(key)
        req.onsuccess = () => resolve(req.result as T | undefined)
        req.onerror = () => reject(req.error)
      })
  )
}

function txGetAll<T>(store: string): Promise<T[]> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readonly')
        const req = tx.objectStore(store).getAll()
        req.onsuccess = () => resolve(req.result as T[])
        req.onerror = () => reject(req.error)
      })
  )
}

function txPut<T>(store: string, value: T): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite')
        tx.objectStore(store).put(value)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
  )
}

function txDelete(store: string, key: string): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite')
        tx.objectStore(store).delete(key)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
  )
}

export async function getPuzzles(): Promise<Puzzle[]> {
  return txGetAll<Puzzle>(PUZZLES_STORE)
}

export async function getPuzzle(id: string): Promise<Puzzle | undefined> {
  return txGet<Puzzle>(PUZZLES_STORE, id)
}

export async function savePuzzle(puzzle: Puzzle): Promise<void> {
  return txPut(PUZZLES_STORE, puzzle)
}

export async function deletePuzzle(id: string): Promise<void> {
  return txDelete(PUZZLES_STORE, id)
}

export interface StoredPhoto {
  id: string
  dataUrl: string
  label: string
  fileName: string
}

export async function savePhoto(photo: StoredPhoto): Promise<void> {
  return txPut(PHOTOS_STORE, photo)
}

export async function getPhoto(
  id: string
): Promise<StoredPhoto | undefined> {
  return txGet<StoredPhoto>(PHOTOS_STORE, id)
}

export async function getAllPhotos(): Promise<StoredPhoto[]> {
  return txGetAll<StoredPhoto>(PHOTOS_STORE)
}

export async function deletePhoto(id: string): Promise<void> {
  return txDelete(PHOTOS_STORE, id)
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function photoToUrl(photo: StoredPhoto | Photo): string {
  if ('dataUrl' in photo) return photo.dataUrl
  return photo.url
}
