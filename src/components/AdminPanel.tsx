import { useState, useEffect, useRef, useCallback } from 'react'
import type { Puzzle, PuzzleCell, Photo } from '../types'
import {
  getPuzzles,
  savePuzzle,
  deletePuzzle,
  savePhoto,
  deletePhoto,
  getAllPhotos,
  fileToDataUrl,
  generateId,
} from '../lib/storage'
import type { StoredPhoto } from '../lib/storage'
import './AdminPanel.css'

interface AdminPanelProps {
  onBack: () => void
  onPuzzlesChanged: () => void
}

interface Toast {
  id: number
  type: 'success' | 'error'
  text: string
}

export default function AdminPanel({ onBack, onPuzzlesChanged }: AdminPanelProps) {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([])
  const [photos, setPhotos] = useState<StoredPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [editingPuzzleId, setEditingPuzzleId] = useState<string | null>(null)
  const [tab, setTab] = useState<'puzzles' | 'photos'>('puzzles')
  const toastId = useRef(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const toast = useCallback((type: 'success' | 'error', text: string) => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, type, text }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const loadData = useCallback(async () => {
    try {
      const [p, ph] = await Promise.all([getPuzzles(), getAllPhotos()])
      setPuzzles(p)
      setPhotos(ph)
    } catch {
      toast('error', 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleUploadPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      try {
        const dataUrl = await fileToDataUrl(file)
        const id = generateId()
        const label = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        const stored: StoredPhoto = { id, dataUrl, label, fileName: file.name }
        await savePhoto(stored)
        setPhotos((prev) => [...prev, stored])
        toast('success', `Uploaded "${label}"`)
      } catch {
        toast('error', `Failed to upload ${file.name}`)
      }
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDeletePhoto(id: string) {
    if (!confirm('Delete this photo?')) return
    try {
      await deletePhoto(id)
      setPhotos((prev) => prev.filter((p) => p.id !== id))
      toast('success', 'Photo deleted.')
    } catch {
      toast('error', 'Failed to delete photo.')
    }
  }

  function handleUpdatePhotoLabel(id: string, label: string) {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, label } : p))
    )
    const photo = photos.find((p) => p.id === id)
    if (photo) {
      savePhoto({ ...photo, label }).catch(() =>
        toast('error', 'Failed to save label.')
      )
    }
  }

  async function handleCreatePuzzle() {
    const puzzle: Puzzle = {
      id: generateId(),
      name: 'New Puzzle',
      cells: [],
      photos: [],
      createdAt: new Date().toISOString(),
    }
    await savePuzzle(puzzle)
    setPuzzles((prev) => [...prev, puzzle])
    setEditingPuzzleId(puzzle.id)
    toast('success', 'Puzzle created! Add cells and assign photos.')
    onPuzzlesChanged()
  }

  async function handleDeletePuzzle(id: string, name: string) {
    if (!confirm(`Delete puzzle "${name}"?`)) return
    try {
      await deletePuzzle(id)
      setPuzzles((prev) => prev.filter((p) => p.id !== id))
      if (editingPuzzleId === id) setEditingPuzzleId(null)
      toast('success', `"${name}" deleted.`)
      onPuzzlesChanged()
    } catch {
      toast('error', 'Failed to delete puzzle.')
    }
  }

  async function handleSavePuzzle(puzzle: Puzzle) {
    try {
      await savePuzzle(puzzle)
      setPuzzles((prev) => prev.map((p) => (p.id === puzzle.id ? puzzle : p)))
      toast('success', `"${puzzle.name}" saved.`)
      onPuzzlesChanged()
    } catch {
      toast('error', 'Failed to save puzzle.')
    }
  }

  const editingPuzzle = puzzles.find((p) => p.id === editingPuzzleId)

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <button className="admin-back-btn" onClick={onBack}>
          ← Back to Game
        </button>
        <h1>⚙️ Puzzle Admin</h1>
      </header>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${tab === 'puzzles' ? 'active' : ''}`}
          onClick={() => setTab('puzzles')}
        >
          🧩 Puzzles
        </button>
        <button
          className={`admin-tab ${tab === 'photos' ? 'active' : ''}`}
          onClick={() => setTab('photos')}
        >
          📷 Photo Library
        </button>
      </div>

      {loading ? (
        <p className="admin-loading">Loading...</p>
      ) : tab === 'photos' ? (
        <PhotoLibrary
          photos={photos}
          onUpload={handleUploadPhotos}
          onDelete={handleDeletePhoto}
          onUpdateLabel={handleUpdatePhotoLabel}
          fileRef={fileRef}
        />
      ) : editingPuzzle ? (
        <PuzzleEditor
          puzzle={editingPuzzle}
          allPhotos={photos}
          onSave={handleSavePuzzle}
          onClose={() => setEditingPuzzleId(null)}
          toast={toast}
        />
      ) : (
        <PuzzleList
          puzzles={puzzles}
          onCreate={handleCreatePuzzle}
          onEdit={(id) => setEditingPuzzleId(id)}
          onDelete={handleDeletePuzzle}
        />
      )}

      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' ? '✓ ' : '✗ '}
            {t.text}
          </div>
        ))}
      </div>
    </div>
  )
}

function PhotoLibrary({
  photos,
  onUpload,
  onDelete,
  onUpdateLabel,
  fileRef,
}: {
  photos: StoredPhoto[]
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDelete: (id: string) => void
  onUpdateLabel: (id: string, label: string) => void
  fileRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <div className="photo-library">
      <div className="upload-section">
        <h2>Upload Photos</h2>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          onChange={onUpload}
          data-testid="photo-upload"
        />
      </div>
      <h2>Library ({photos.length} photos)</h2>
      {photos.length === 0 ? (
        <p className="empty-text">
          No photos yet. Upload some to get started!
        </p>
      ) : (
        <div className="photo-lib-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="photo-lib-item">
              <img src={photo.dataUrl} alt={photo.label} />
              <input
                type="text"
                value={photo.label}
                onChange={(e) => onUpdateLabel(photo.id, e.target.value)}
                className="photo-lib-label"
                placeholder="Label"
              />
              <button
                className="photo-lib-delete"
                onClick={() => onDelete(photo.id)}
              >
                🗑️ Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PuzzleList({
  puzzles,
  onCreate,
  onEdit,
  onDelete,
}: {
  puzzles: Puzzle[]
  onCreate: () => void
  onEdit: (id: string) => void
  onDelete: (id: string, name: string) => void
}) {
  return (
    <div className="puzzle-list-admin">
      <div className="puzzle-list-header">
        <h2>Puzzles ({puzzles.length})</h2>
        <button
          className="create-btn"
          onClick={onCreate}
          data-testid="create-puzzle"
        >
          + New Puzzle
        </button>
      </div>
      {puzzles.length === 0 ? (
        <p className="empty-text">No puzzles yet. Create one!</p>
      ) : (
        <div className="puzzle-admin-cards">
          {puzzles.map((puzzle) => (
            <div key={puzzle.id} className="puzzle-admin-card">
              <div className="pac-info">
                <h3>{puzzle.name}</h3>
                <p>
                  {puzzle.cells.length} cells · {puzzle.photos.length} photos
                </p>
              </div>
              <div className="pac-actions">
                <button onClick={() => onEdit(puzzle.id)}>✏️ Edit</button>
                <button onClick={() => onDelete(puzzle.id, puzzle.name)}>
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PuzzleEditor({
  puzzle,
  allPhotos,
  onSave,
  onClose,
  toast,
}: {
  puzzle: Puzzle
  allPhotos: StoredPhoto[]
  onSave: (puzzle: Puzzle) => Promise<void>
  onClose: () => void
  toast: (type: 'success' | 'error', text: string) => void
}) {
  const [name, setName] = useState(puzzle.name)
  const [cells, setCells] = useState<PuzzleCell[]>([...puzzle.cells])
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>(
    puzzle.photos.map((p) => p.id)
  )
  const [saving, setSaving] = useState(false)

  function addCell() {
    if (cells.length >= 9) {
      toast('error', 'Maximum 9 cells for a 3×3 grid.')
      return
    }
    setCells((prev) => [
      ...prev,
      { id: generateId(), clue: '', hint: '', correctPhotoId: '' },
    ])
  }

  function removeCell(index: number) {
    setCells((prev) => prev.filter((_, i) => i !== index))
  }

  function updateCell(
    index: number,
    field: keyof PuzzleCell,
    value: string
  ) {
    setCells((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    )
  }

  function togglePhoto(photoId: string) {
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : prev.length >= 9
          ? (toast('error', 'Maximum 9 photos for a 3×3 grid.'), prev)
          : [...prev, photoId]
    )
  }

  async function handleSave() {
    if (!name.trim()) {
      toast('error', 'Puzzle name is required.')
      return
    }
    if (cells.length !== 9) {
      toast('error', 'A puzzle needs exactly 9 cells for a 3×3 grid.')
      return
    }
    if (selectedPhotoIds.length !== 9) {
      toast('error', 'A puzzle needs exactly 9 photos for a 3×3 grid.')
      return
    }
    for (let i = 0; i < cells.length; i++) {
      if (!cells[i].clue || !cells[i].hint || !cells[i].correctPhotoId) {
        toast('error', `Cell ${i + 1} needs a clue, hint, and assigned photo.`)
        return
      }
    }

    const usedPhotoIds = new Set(cells.map((c) => c.correctPhotoId))
    if (usedPhotoIds.size !== cells.length) {
      toast('error', 'Each cell must use a different photo.')
      return
    }

    setSaving(true)
    const photos: Photo[] = selectedPhotoIds
      .map((id) => {
        const stored = allPhotos.find((p) => p.id === id)
        if (!stored) return null
        return { id: stored.id, url: stored.dataUrl, label: stored.label }
      })
      .filter(Boolean) as Photo[]

    await onSave({ ...puzzle, name, cells, photos })
    setSaving(false)
  }

  const assignablePhotos = allPhotos.filter((p) =>
    selectedPhotoIds.includes(p.id)
  )

  return (
    <div className="puzzle-editor">
      <div className="editor-header">
        <button className="editor-back" onClick={onClose}>
          ← Back to List
        </button>
        <h2>Edit: {puzzle.name}</h2>
      </div>

      <div className="editor-section">
        <label>Puzzle Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="editor-input"
          placeholder="e.g. Cruise Ship Adventure"
          data-testid="puzzle-name"
        />
      </div>

      <div className="editor-section">
        <h3>
          📷 Select Photos ({selectedPhotoIds.length}/9)
        </h3>
        <p className="editor-hint">
          Choose exactly 9 photos from your library for the answer grid.
        </p>
        {allPhotos.length === 0 ? (
          <p className="empty-text">
            No photos in library. Go to Photo Library tab to upload some.
          </p>
        ) : (
          <div className="photo-picker-grid">
            {allPhotos.map((photo) => (
              <button
                key={photo.id}
                className={`photo-picker-item ${selectedPhotoIds.includes(photo.id) ? 'selected' : ''}`}
                onClick={() => togglePhoto(photo.id)}
              >
                <img src={photo.dataUrl} alt={photo.label} />
                <span>{photo.label}</span>
                {selectedPhotoIds.includes(photo.id) && (
                  <span className="check-mark">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="editor-section">
        <div className="cells-header">
          <h3>🧩 Cells ({cells.length}/9)</h3>
          {cells.length < 9 && (
            <button className="add-cell-btn" onClick={addCell}>
              + Add Cell
            </button>
          )}
        </div>
        <div className="cells-list">
          {cells.map((cell, index) => (
            <div key={cell.id} className="cell-editor">
              <div className="cell-editor-header">
                <strong>Cell {index + 1}</strong>
                <button
                  className="remove-cell-btn"
                  onClick={() => removeCell(index)}
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                value={cell.clue}
                onChange={(e) => updateCell(index, 'clue', e.target.value)}
                placeholder="Clue (what the child sees)"
                className="editor-input"
              />
              <input
                type="text"
                value={cell.hint}
                onChange={(e) => updateCell(index, 'hint', e.target.value)}
                placeholder="Hint (shown on wrong answer)"
                className="editor-input"
              />
              <select
                value={cell.correctPhotoId}
                onChange={(e) =>
                  updateCell(index, 'correctPhotoId', e.target.value)
                }
                className="editor-input"
              >
                <option value="">— Select correct photo —</option>
                {assignablePhotos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="editor-actions">
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={saving}
          data-testid="save-puzzle"
        >
          {saving ? 'Saving...' : '💾 Save Puzzle'}
        </button>
        <button className="cancel-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}
