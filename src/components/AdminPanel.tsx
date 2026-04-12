import { useState, useEffect, useRef, useCallback } from 'react'
import type { Puzzle, PuzzleCell, Photo } from '../types'
import {
  login,
  logout,
  isLoggedIn,
  fetchPuzzles,
  createPuzzle,
  updatePuzzle,
  deletePuzzleApi,
  uploadImage,
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

interface CellDraft {
  id: string
  clue: string
  hint: string
  photo: Photo | null
  pendingFile: File | null
  pendingPreview: string
}

export default function AdminPanel({ onBack, onPuzzlesChanged }: AdminPanelProps) {
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(true)

  const [puzzles, setPuzzles] = useState<Puzzle[]>([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [editingPuzzleId, setEditingPuzzleId] = useState<string | null>(null)

  const toastId = useRef(0)

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
      const p = await fetchPuzzles()
      setPuzzles(p)
    } catch {
      toast('error', 'Failed to load puzzles.')
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
  }

  async function handleCreatePuzzle() {
    const puzzle: Puzzle = {
      id: generateId(),
      name: '',
      cells: [],
      photos: [],
      createdAt: new Date().toISOString(),
    }
    try {
      await createPuzzle(puzzle)
      setPuzzles((prev) => [...prev, puzzle])
      setEditingPuzzleId(puzzle.id)
      toast('success', 'New puzzle created! Give it a name and add 9 photos.')
      onPuzzlesChanged()
    } catch {
      toast('error', 'Failed to create puzzle.')
    }
  }

  async function handleDeletePuzzle(id: string, name: string) {
    if (!confirm(`Delete puzzle "${name || 'Untitled'}"?`)) return
    try {
      await deletePuzzleApi(id)
      setPuzzles((prev) => prev.filter((p) => p.id !== id))
      if (editingPuzzleId === id) setEditingPuzzleId(null)
      toast('success', `"${name || 'Untitled'}" deleted.`)
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
          <p>Enter the admin password to manage puzzles.</p>
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
        <button className="admin-back-btn" onClick={onBack}>← Back to Game</button>
        <h1>⚙️ Puzzle Admin</h1>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </header>

      {loading ? (
        <p className="admin-loading">Loading...</p>
      ) : editingPuzzle ? (
        <PuzzleEditor
          puzzle={editingPuzzle}
          onSave={handleSavePuzzle}
          onClose={() => setEditingPuzzleId(null)}
          toast={toast}
        />
      ) : (
        <PuzzleListView
          puzzles={puzzles}
          onCreate={handleCreatePuzzle}
          onEdit={(id) => setEditingPuzzleId(id)}
          onDelete={handleDeletePuzzle}
        />
      )}

      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' ? '✓ ' : '✗ '}{t.text}
          </div>
        ))}
      </div>
    </div>
  )
}

function PuzzleListView({
  puzzles, onCreate, onEdit, onDelete,
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
        <button className="create-btn" onClick={onCreate} data-testid="create-puzzle">+ New Puzzle</button>
      </div>
      {puzzles.length === 0 ? (
        <p className="empty-text">No puzzles yet. Create one!</p>
      ) : (
        <div className="puzzle-admin-cards">
          {puzzles.map((puzzle) => (
            <div key={puzzle.id} className="puzzle-admin-card">
              <div className="pac-info">
                <h3>{puzzle.name || <em>Untitled</em>}</h3>
                <p>{puzzle.cells.length}/9 cells · {puzzle.photos.length} photos</p>
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

function puzzleToDrafts(puzzle: Puzzle): CellDraft[] {
  return puzzle.cells.map((cell) => {
    const photo = puzzle.photos.find((p) => p.id === cell.correctPhotoId) ?? null
    return { id: cell.id, clue: cell.clue, hint: cell.hint, photo, pendingFile: null, pendingPreview: '' }
  })
}

function PuzzleEditor({
  puzzle, onSave, onClose, toast,
}: {
  puzzle: Puzzle
  onSave: (puzzle: Puzzle) => Promise<void>
  onClose: () => void
  toast: (type: 'success' | 'error', text: string) => void
}) {
  const [name, setName] = useState(puzzle.name)
  const [drafts, setDrafts] = useState<CellDraft[]>(() => puzzleToDrafts(puzzle))
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [soundUrl, setSoundUrl] = useState(puzzle.celebrationSoundUrl || '')
  const [soundPathname, setSoundPathname] = useState(puzzle.celebrationSoundPathname || '')
  const [pendingSoundFile, setPendingSoundFile] = useState<File | null>(null)
  const [pendingSoundName, setPendingSoundName] = useState('')
  const fileRefs = useRef<(HTMLInputElement | null)[]>([])
  const soundFileRef = useRef<HTMLInputElement>(null)

  function addCell() {
    if (drafts.length >= 9) { toast('error', 'Maximum 9 cells for a 3×3 grid.'); return }
    setDrafts((prev) => [...prev, {
      id: generateId(), clue: '', hint: '', photo: null, pendingFile: null, pendingPreview: '',
    }])
  }

  function removeCell(index: number) {
    setDrafts((prev) => {
      if (prev[index].pendingPreview) URL.revokeObjectURL(prev[index].pendingPreview)
      return prev.filter((_, i) => i !== index)
    })
  }

  function updateDraft(index: number, field: 'clue' | 'hint', value: string) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)))
  }

  function handlePhotoSelected(index: number, file: File) {
    const preview = URL.createObjectURL(file)
    const label = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    setDrafts((prev) => prev.map((d, i) => {
      if (i !== index) return d
      if (d.pendingPreview) URL.revokeObjectURL(d.pendingPreview)
      return { ...d, pendingFile: file, pendingPreview: preview, photo: { id: d.photo?.id || generateId(), url: '', pathname: '', label } }
    }))
  }

  function updatePhotoLabel(index: number, label: string) {
    setDrafts((prev) => prev.map((d, i) => {
      if (i !== index || !d.photo) return d
      return { ...d, photo: { ...d.photo, label } }
    }))
  }

  function clearPhoto(index: number) {
    setDrafts((prev) => prev.map((d, i) => {
      if (i !== index) return d
      if (d.pendingPreview) URL.revokeObjectURL(d.pendingPreview)
      return { ...d, photo: null, pendingFile: null, pendingPreview: '' }
    }))
  }

  function moveCell(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= drafts.length) return
    setDrafts((prev) => {
      const arr = [...prev]
      const [moved] = arr.splice(index, 1)
      arr.splice(target, 0, moved)
      return arr
    })
  }

  async function handleSave() {
    if (!name.trim()) { toast('error', 'Puzzle name is required.'); return }

    const filesToUpload = drafts.filter((d) => d.pendingFile).length
    const completeCount = drafts.filter((d) =>
      (d.photo?.url || d.pendingFile) && d.clue.trim() && d.hint.trim()
    ).length

    setSaving(true)
    try {
      const photos: Photo[] = []
      const cells: PuzzleCell[] = []
      let uploadIdx = 0

      for (let i = 0; i < drafts.length; i++) {
        const d = drafts[i]
        const photoId = d.photo?.id || generateId()
        let photo: Photo = d.photo || { id: photoId, url: '', pathname: '', label: '' }

        if (d.pendingFile) {
          uploadIdx++
          setUploadProgress(`Uploading photo ${uploadIdx} of ${filesToUpload}...`)
          const { url, pathname } = await uploadImage(d.pendingFile)
          photo = { ...photo, url, pathname }
        }

        photos.push(photo)
        cells.push({ id: d.id, clue: d.clue, hint: d.hint, correctPhotoId: photo.id })
      }

      let finalSoundUrl = soundUrl
      let finalSoundPathname = soundPathname
      if (pendingSoundFile) {
        setUploadProgress('Uploading celebration sound...')
        const result = await uploadImage(pendingSoundFile)
        finalSoundUrl = result.url
        finalSoundPathname = result.pathname
        setSoundUrl(result.url)
        setSoundPathname(result.pathname)
        setPendingSoundFile(null)
        setPendingSoundName('')
      }

      setUploadProgress('Saving puzzle...')
      await onSave({
        ...puzzle,
        name,
        cells,
        photos,
        celebrationSoundUrl: finalSoundUrl || undefined,
        celebrationSoundPathname: finalSoundPathname || undefined,
      })

      setDrafts(drafts.map((d, i) => ({
        ...d,
        photo: photos[i],
        pendingFile: null,
        pendingPreview: d.pendingPreview ? (URL.revokeObjectURL(d.pendingPreview), '') : '',
      })))

      if (completeCount < drafts.length) {
        toast('success', `Saved! ${completeCount}/${drafts.length} cells complete.`)
      }
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
      setUploadProgress('')
    }
  }

  return (
    <div className="puzzle-editor">
      <div className="editor-header">
        <button className="editor-back" onClick={onClose}>← Back to List</button>
        <h2>{puzzle.name ? `Edit: ${puzzle.name}` : 'New Puzzle'}</h2>
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
        <label>🔊 Celebration Sound (optional)</label>
        <p className="editor-hint">
          Upload a WAV file (up to 3 seconds) to play when the child guesses correctly. If none is set, the default fireworks sound plays.
        </p>
        {soundUrl && !pendingSoundFile ? (
          <div className="sound-preview">
            <audio controls src={soundUrl} />
            <button
              className="sound-clear-btn"
              onClick={() => {
                setSoundUrl('')
                setSoundPathname('')
              }}
            >
              ✕ Remove
            </button>
          </div>
        ) : pendingSoundFile ? (
          <div className="sound-preview">
            <span className="sound-pending-name">🎵 {pendingSoundName}</span>
            <button
              className="sound-clear-btn"
              onClick={() => {
                setPendingSoundFile(null)
                setPendingSoundName('')
              }}
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          <div className="sound-upload">
            <label className="sound-upload-label">
              <span>🎵 Upload WAV</span>
              <input
                ref={soundFileRef}
                type="file"
                accept=".wav,audio/wav,audio/x-wav"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setPendingSoundFile(file)
                    setPendingSoundName(file.name)
                  }
                  e.target.value = ''
                }}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        )}
      </div>

      <div className="editor-section">
        <div className="cells-header">
          <h3>🧩 Puzzle Cells ({drafts.length}/9)</h3>
          {drafts.length < 9 && (
            <button className="add-cell-btn" onClick={addCell}>+ Add Cell</button>
          )}
        </div>
        <p className="editor-hint">
          Each cell needs a photo, a clue, and a hint. You can save at any time and come back to finish later.
        </p>

        <div className="cells-list">
          {drafts.map((draft, index) => {
            const hasPhoto = !!(draft.pendingFile || draft.photo?.url)
            const isComplete = hasPhoto && draft.clue.trim() && draft.hint.trim()
            return (
            <div key={draft.id} className={`cell-editor ${isComplete ? 'cell-complete' : ''}`}>
              <div className="cell-editor-header">
                <strong>{isComplete ? '✅' : '⬜'} Cell {index + 1}</strong>
                <div className="cell-header-actions">
                  <button
                    onClick={() => moveCell(index, -1)}
                    disabled={index === 0}
                    className="arrow-btn"
                    title="Move up"
                  >↑</button>
                  <button
                    onClick={() => moveCell(index, 1)}
                    disabled={index === drafts.length - 1}
                    className="arrow-btn"
                    title="Move down"
                  >↓</button>
                  <button className="remove-cell-btn" onClick={() => removeCell(index)}>✕</button>
                </div>
              </div>

              <div className="cell-body">
                <div className="cell-photo-area">
                  {draft.pendingPreview || draft.photo?.url ? (
                    <div className="cell-photo-preview">
                      <img src={draft.pendingPreview || draft.photo!.url} alt={draft.photo?.label || ''} />
                      <button className="photo-clear-btn" onClick={() => clearPhoto(index)}>✕</button>
                    </div>
                  ) : (
                    <label className="cell-photo-upload">
                      <span>📷</span>
                      <span>Upload Photo</span>
                      <input
                        ref={(el) => { fileRefs.current[index] = el }}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handlePhotoSelected(index, file)
                          e.target.value = ''
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>

                <div className="cell-fields">
                  {draft.photo && (
                    <input
                      type="text"
                      value={draft.photo.label}
                      onChange={(e) => updatePhotoLabel(index, e.target.value)}
                      placeholder="Photo label (shown to player)"
                      className="editor-input"
                    />
                  )}
                  <input
                    type="text"
                    value={draft.clue}
                    onChange={(e) => updateDraft(index, 'clue', e.target.value)}
                    placeholder="Clue — what the child reads"
                    className="editor-input"
                  />
                  <input
                    type="text"
                    value={draft.hint}
                    onChange={(e) => updateDraft(index, 'hint', e.target.value)}
                    placeholder="Hint — shown on wrong answer"
                    className="editor-input"
                  />
                </div>
              </div>
            </div>
          )})}
        </div>
      </div>

      <div className="editor-actions">
        <button className="save-btn" onClick={handleSave} disabled={saving} data-testid="save-puzzle">
          {saving ? uploadProgress || 'Saving...' : '💾 Save Puzzle'}
        </button>
        <button className="cancel-btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
