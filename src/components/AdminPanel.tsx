import { useState, useEffect, useRef, useCallback } from 'react'
import type { Puzzle, PuzzleCell, Photo, PhotoMeta } from '../types'
import {
  login,
  logout,
  isLoggedIn,
  fetchPhotos,
  savePhotosManifest,
  uploadImage,
  deletePhoto,
  fetchPuzzles,
  createPuzzle,
  updatePuzzle,
  deletePuzzleApi,
} from '../lib/api'
import { generateId } from '../lib/storage'
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

interface PendingImage {
  file: File
  label: string
  description: string
  preview: string
}

export default function AdminPanel({ onBack, onPuzzlesChanged }: AdminPanelProps) {
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(true)

  const [puzzles, setPuzzles] = useState<Puzzle[]>([])
  const [photos, setPhotos] = useState<PhotoMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [editingPuzzleId, setEditingPuzzleId] = useState<string | null>(null)
  const [tab, setTab] = useState<'puzzles' | 'photos'>('puzzles')

  const [pendingFiles, setPendingFiles] = useState<PendingImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null)
  const [editPhotoForm, setEditPhotoForm] = useState({ label: '', description: '' })
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null)

  const toastId = useRef(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const toast = useCallback((type: 'success' | 'error', text: string) => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, type, text }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  useEffect(() => {
    if (isLoggedIn()) setToken(sessionStorage.getItem('admin_token'))
    setAuthLoading(false)
  }, [])

  useEffect(() => {
    if (token) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function loadData() {
    try {
      const [p, ph] = await Promise.all([fetchPuzzles(), fetchPhotos()])
      setPuzzles(p)
      setPhotos(ph)
    } catch {
      toast('error', 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    try {
      const t = await login(password)
      setToken(t)
      setPassword('')
    } catch {
      setAuthError('Login failed. Check your password.')
    }
  }

  function handleLogout() {
    logout()
    setToken(null)
    setPuzzles([])
    setPhotos([])
  }

  // --- Photo upload (cjs_foto style) ---

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    const items: PendingImage[] = Array.from(files).map((f) => ({
      file: f,
      label: f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      description: '',
      preview: URL.createObjectURL(f),
    }))
    setPendingFiles((prev) => [...prev, ...items])
  }

  function updatePending(idx: number, field: string, value: string) {
    setPendingFiles((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    )
  }

  function removePending(idx: number) {
    setPendingFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  async function handleUploadAll() {
    if (pendingFiles.length === 0) {
      toast('error', 'Select images first.')
      return
    }
    for (const p of pendingFiles) {
      if (!p.label.trim()) {
        toast('error', 'Each photo needs a label.')
        return
      }
    }

    setUploading(true)
    const newPhotos: PhotoMeta[] = []
    try {
      for (let i = 0; i < pendingFiles.length; i++) {
        setUploadProgress(`Uploading ${i + 1} of ${pendingFiles.length}...`)
        const { url, pathname } = await uploadImage(pendingFiles[i].file)
        newPhotos.push({
          id: generateId(),
          url,
          pathname,
          label: pendingFiles[i].label,
          description: pendingFiles[i].description,
        })
      }
      setUploadProgress('Saving manifest...')
      const all = [...photos, ...newPhotos]
      await savePhotosManifest(all)
      setPhotos(all)
      pendingFiles.forEach((p) => URL.revokeObjectURL(p.preview))
      setPendingFiles([])
      if (fileRef.current) fileRef.current.value = ''
      toast('success', `Uploaded ${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''}.`)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  async function handleDeletePhoto(photo: PhotoMeta) {
    if (!confirm(`Delete "${photo.label}"?`)) return
    setDeletingPhoto(photo.id)
    try {
      await deletePhoto(photo.id, photo.pathname)
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
      toast('success', 'Photo deleted.')
    } catch {
      toast('error', 'Failed to delete.')
    } finally {
      setDeletingPhoto(null)
    }
  }

  function startEditingPhoto(photo: PhotoMeta) {
    setEditingPhotoId(photo.id)
    setEditPhotoForm({ label: photo.label, description: photo.description })
  }

  async function handleSavePhotoEdit() {
    if (!editingPhotoId) return
    const updated = photos.map((p) =>
      p.id === editingPhotoId
        ? { ...p, label: editPhotoForm.label, description: editPhotoForm.description }
        : p
    )
    setPhotos(updated)
    setEditingPhotoId(null)
    try {
      await savePhotosManifest(updated)
      toast('success', 'Photo details saved.')
    } catch {
      toast('error', 'Failed to save.')
    }
  }

  async function movePhoto(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= photos.length) return
    const reordered = [...photos]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(target, 0, moved)
    setPhotos(reordered)
    try {
      await savePhotosManifest(reordered)
      toast('success', 'Order saved.')
    } catch {
      toast('error', 'Failed to save order.')
    }
  }

  // --- Puzzle CRUD ---

  async function handleCreatePuzzle() {
    const puzzle: Puzzle = {
      id: generateId(),
      name: 'New Puzzle',
      cells: [],
      photos: [],
      createdAt: new Date().toISOString(),
    }
    try {
      await createPuzzle(puzzle)
      setPuzzles((prev) => [...prev, puzzle])
      setEditingPuzzleId(puzzle.id)
      toast('success', 'Puzzle created!')
      onPuzzlesChanged()
    } catch {
      toast('error', 'Failed to create puzzle.')
    }
  }

  async function handleDeletePuzzle(id: string, name: string) {
    if (!confirm(`Delete puzzle "${name}"?`)) return
    try {
      await deletePuzzleApi(id)
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
      await updatePuzzle(puzzle)
      setPuzzles((prev) => prev.map((p) => (p.id === puzzle.id ? puzzle : p)))
      toast('success', `"${puzzle.name}" saved.`)
      onPuzzlesChanged()
    } catch {
      toast('error', 'Failed to save puzzle.')
    }
  }

  const editingPuzzle = puzzles.find((p) => p.id === editingPuzzleId)

  if (authLoading) return null

  if (!token) {
    return (
      <div className="admin-login-wrapper">
        <form onSubmit={handleLogin} className="admin-login-form">
          <h1>🔒 Admin Login</h1>
          <p>Enter the admin password to manage puzzles and photos.</p>
          {authError && <p className="auth-error">{authError}</p>}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="editor-input"
          />
          <button type="submit" className="save-btn" style={{ marginTop: 12, width: '100%' }}>
            Log In
          </button>
          <button type="button" className="cancel-btn" onClick={onBack} style={{ marginTop: 8, width: '100%' }}>
            ← Back to Game
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <button className="admin-back-btn" onClick={onBack}>
          ← Back to Game
        </button>
        <h1>⚙️ Puzzle Admin</h1>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </header>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'puzzles' ? 'active' : ''}`} onClick={() => setTab('puzzles')}>
          🧩 Puzzles
        </button>
        <button className={`admin-tab ${tab === 'photos' ? 'active' : ''}`} onClick={() => setTab('photos')}>
          📷 Photo Library
        </button>
      </div>

      {loading ? (
        <p className="admin-loading">Loading...</p>
      ) : tab === 'photos' ? (
        <div className="photo-library">
          {/* Upload section */}
          <div className="upload-section">
            <h2>Upload Photos</h2>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFilesSelected}
              data-testid="photo-upload"
              className="file-input"
            />
            {pendingFiles.length > 0 && (
              <div className="pending-list">
                <p className="pending-count">
                  {pendingFiles.length} image{pendingFiles.length > 1 ? 's' : ''} selected — fill in details
                </p>
                {pendingFiles.map((p, i) => (
                  <div key={i} className="pending-item">
                    <div className="pending-preview">
                      <img src={p.preview} alt={p.label} />
                    </div>
                    <div className="pending-fields">
                      <input
                        type="text"
                        value={p.label}
                        onChange={(e) => updatePending(i, 'label', e.target.value)}
                        placeholder="Label *"
                        className="editor-input"
                      />
                      <input
                        type="text"
                        value={p.description}
                        onChange={(e) => updatePending(i, 'description', e.target.value)}
                        placeholder="Description (optional)"
                        className="editor-input"
                      />
                    </div>
                    <button onClick={() => removePending(i)} className="pending-remove">&times;</button>
                  </div>
                ))}
                <button
                  onClick={handleUploadAll}
                  disabled={uploading}
                  className="save-btn"
                  style={{ marginTop: 12 }}
                >
                  {uploading ? uploadProgress || 'Uploading...' : `Upload ${pendingFiles.length} Photo${pendingFiles.length > 1 ? 's' : ''}`}
                </button>
              </div>
            )}
          </div>

          {/* Photo grid with reorder/edit/delete */}
          <div className="lib-header">
            <h2>Library ({photos.length} photos)</h2>
            <p className="lib-hint">Use arrows to reorder photos</p>
          </div>
          {photos.length === 0 ? (
            <p className="empty-text">No photos yet. Upload some to get started!</p>
          ) : (
            <div className="photo-lib-grid">
              {photos.map((photo, idx) => {
                const isEditing = editingPhotoId === photo.id
                return (
                  <div
                    key={photo.id}
                    className={`photo-lib-item ${deletingPhoto === photo.id ? 'deleting' : ''}`}
                  >
                    <img src={photo.url} alt={photo.label} />
                    {isEditing ? (
                      <div className="photo-edit-fields">
                        <input
                          type="text"
                          value={editPhotoForm.label}
                          onChange={(e) => setEditPhotoForm({ ...editPhotoForm, label: e.target.value })}
                          placeholder="Label"
                          className="editor-input"
                        />
                        <input
                          type="text"
                          value={editPhotoForm.description}
                          onChange={(e) => setEditPhotoForm({ ...editPhotoForm, description: e.target.value })}
                          placeholder="Description"
                          className="editor-input"
                        />
                        <div className="photo-edit-actions">
                          <button onClick={handleSavePhotoEdit} className="mini-save">Save</button>
                          <button onClick={() => setEditingPhotoId(null)} className="mini-cancel">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="photo-info">
                        <p className="photo-info-label">{photo.label}</p>
                        {photo.description && <p className="photo-info-desc">{photo.description}</p>}
                      </div>
                    )}
                    <div className="photo-lib-actions">
                      <div className="reorder-btns">
                        <button onClick={() => movePhoto(idx, -1)} disabled={idx === 0} className="arrow-btn">←</button>
                        <button onClick={() => movePhoto(idx, 1)} disabled={idx === photos.length - 1} className="arrow-btn">→</button>
                      </div>
                      <div className="edit-del-btns">
                        {!isEditing && (
                          <button onClick={() => startEditingPhoto(photo)} className="mini-edit">Edit</button>
                        )}
                        <button
                          onClick={() => handleDeletePhoto(photo)}
                          disabled={deletingPhoto === photo.id}
                          className="mini-delete"
                        >
                          {deletingPhoto === photo.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
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
        <button className="create-btn" onClick={onCreate} data-testid="create-puzzle">
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
                <p>{puzzle.cells.length} cells · {puzzle.photos.length} photos</p>
              </div>
              <div className="pac-actions">
                <button onClick={() => onEdit(puzzle.id)}>✏️ Edit</button>
                <button onClick={() => onDelete(puzzle.id, puzzle.name)}>🗑️ Delete</button>
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
  allPhotos: PhotoMeta[]
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
    if (cells.length >= 9) { toast('error', 'Maximum 9 cells.'); return }
    setCells((prev) => [...prev, { id: generateId(), clue: '', hint: '', correctPhotoId: '' }])
  }

  function removeCell(index: number) {
    setCells((prev) => prev.filter((_, i) => i !== index))
  }

  function updateCell(index: number, field: keyof PuzzleCell, value: string) {
    setCells((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)))
  }

  function togglePhoto(photoId: string) {
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : prev.length >= 9
          ? (toast('error', 'Maximum 9 photos.'), prev)
          : [...prev, photoId]
    )
  }

  async function handleSave() {
    if (!name.trim()) { toast('error', 'Name is required.'); return }
    if (cells.length !== 9) { toast('error', 'Need exactly 9 cells.'); return }
    if (selectedPhotoIds.length !== 9) { toast('error', 'Need exactly 9 photos.'); return }
    for (let i = 0; i < cells.length; i++) {
      if (!cells[i].clue || !cells[i].hint || !cells[i].correctPhotoId) {
        toast('error', `Cell ${i + 1} needs clue, hint, and photo.`); return
      }
    }
    const used = new Set(cells.map((c) => c.correctPhotoId))
    if (used.size !== cells.length) { toast('error', 'Each cell must use a different photo.'); return }

    setSaving(true)
    const puzzlePhotos: Photo[] = selectedPhotoIds
      .map((id) => {
        const p = allPhotos.find((ph) => ph.id === id)
        if (!p) return null
        return { id: p.id, url: p.url, label: p.label }
      })
      .filter(Boolean) as Photo[]

    await onSave({ ...puzzle, name, cells, photos: puzzlePhotos })
    setSaving(false)
  }

  const assignable = allPhotos.filter((p) => selectedPhotoIds.includes(p.id))

  return (
    <div className="puzzle-editor">
      <div className="editor-header">
        <button className="editor-back" onClick={onClose}>← Back to List</button>
        <h2>Edit: {puzzle.name}</h2>
      </div>

      <div className="editor-section">
        <label>Puzzle Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="editor-input" data-testid="puzzle-name" />
      </div>

      <div className="editor-section">
        <h3>📷 Select Photos ({selectedPhotoIds.length}/9)</h3>
        <p className="editor-hint">Choose exactly 9 photos for the answer grid.</p>
        {allPhotos.length === 0 ? (
          <p className="empty-text">No photos. Go to Photo Library to upload.</p>
        ) : (
          <div className="photo-picker-grid">
            {allPhotos.map((photo) => (
              <button
                key={photo.id}
                className={`photo-picker-item ${selectedPhotoIds.includes(photo.id) ? 'selected' : ''}`}
                onClick={() => togglePhoto(photo.id)}
              >
                <img src={photo.url} alt={photo.label} />
                <span>{photo.label}</span>
                {selectedPhotoIds.includes(photo.id) && <span className="check-mark">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="editor-section">
        <div className="cells-header">
          <h3>🧩 Cells ({cells.length}/9)</h3>
          {cells.length < 9 && <button className="add-cell-btn" onClick={addCell}>+ Add Cell</button>}
        </div>
        <div className="cells-list">
          {cells.map((cell, index) => (
            <div key={cell.id} className="cell-editor">
              <div className="cell-editor-header">
                <strong>Cell {index + 1}</strong>
                <button className="remove-cell-btn" onClick={() => removeCell(index)}>✕</button>
              </div>
              <input type="text" value={cell.clue} onChange={(e) => updateCell(index, 'clue', e.target.value)} placeholder="Clue" className="editor-input" />
              <input type="text" value={cell.hint} onChange={(e) => updateCell(index, 'hint', e.target.value)} placeholder="Hint" className="editor-input" />
              <select value={cell.correctPhotoId} onChange={(e) => updateCell(index, 'correctPhotoId', e.target.value)} className="editor-input">
                <option value="">— Select photo —</option>
                {assignable.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="editor-actions">
        <button className="save-btn" onClick={handleSave} disabled={saving} data-testid="save-puzzle">
          {saving ? 'Saving...' : '💾 Save Puzzle'}
        </button>
        <button className="cancel-btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
