import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Puzzle, PuzzleCell, Photo, GameProgress } from '../types'
import JigsawPiece from './JigsawPiece'
import PhotoGrid from './PhotoGrid'
import Fireworks from './Fireworks'
import './PuzzleBoard.css'

interface PuzzleBoardProps {
  puzzle: Puzzle
  onBack?: () => void
}

function loadProgress(puzzleId: string): GameProgress {
  try {
    const saved = localStorage.getItem(`progress-${puzzleId}`)
    if (saved) return JSON.parse(saved)
  } catch {
    /* ignore corrupt data */
  }
  return { puzzleId, solvedCellIds: [] }
}

function isCellComplete(cell: PuzzleCell, photos: Photo[]): boolean {
  if (!cell.clue.trim() || !cell.hint.trim()) return false
  const photo = photos.find((p) => p.id === cell.correctPhotoId)
  return !!photo?.url
}

function generatePlaceholder(index: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#e5e4e7" rx="12"/>
    <text x="100" y="90" text-anchor="middle" font-size="40" fill="#b0adb5">🚧</text>
    <text x="100" y="130" text-anchor="middle" font-size="14" fill="#9a979f" font-family="system-ui">Coming Soon</text>
    <text x="100" y="155" text-anchor="middle" font-size="12" fill="#b0adb5" font-family="system-ui">Cell ${index + 1}</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function PuzzleBoard({ puzzle, onBack }: PuzzleBoardProps) {
  const [progress, setProgress] = useState<GameProgress>(() =>
    loadProgress(puzzle.id)
  )
  const [selectedCell, setSelectedCell] = useState<PuzzleCell | null>(null)
  const [hintVisible, setHintVisible] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)
  const [wrongPick, setWrongPick] = useState<string | null>(null)
  const [pieceSize, setPieceSize] = useState(140)
  const [hasGuessed, setHasGuessed] = useState(false)
  const [activeSoundUrl, setActiveSoundUrl] = useState<string | undefined>(undefined)

  const [shuffledCells, setShuffledCells] = useState<PuzzleCell[]>(() =>
    shuffle(puzzle.cells)
  )
  const [shuffledPhotos, setShuffledPhotos] = useState<Photo[]>(() =>
    shuffle(puzzle.photos.filter((p) => p.url))
  )

  const completeCells = useMemo(
    () => shuffledCells.filter((c) => isCellComplete(c, puzzle.photos)),
    [shuffledCells, puzzle.photos]
  )

  const allSolved = useMemo(
    () =>
      completeCells.length > 0 &&
      completeCells.every((c) => progress.solvedCellIds.includes(c.id)),
    [completeCells, progress.solvedCellIds]
  )

  useEffect(() => {
    localStorage.setItem(`progress-${puzzle.id}`, JSON.stringify(progress))
  }, [progress, puzzle.id])

  useEffect(() => {
    function updateSize() {
      const maxGridWidth = Math.min(window.innerWidth - 40, 540)
      setPieceSize(Math.floor(maxGridWidth / 3.6))
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const handleCellClick = useCallback(
    (cell: PuzzleCell) => {
      if (progress.solvedCellIds.includes(cell.id)) return
      if (!isCellComplete(cell, puzzle.photos)) return
      setSelectedCell(cell)
      setHintVisible(false)
      setWrongPick(null)
    },
    [progress.solvedCellIds, puzzle.photos]
  )

  const handlePhotoSelect = useCallback(
    (photoId: string) => {
      if (!selectedCell) return
      setHasGuessed(true)

      if (photoId === selectedCell.correctPhotoId) {
        const cellSound = selectedCell.soundUrl || puzzle.celebrationSoundUrl || undefined
        setActiveSoundUrl(cellSound)
        setShowFireworks(true)
        setProgress((prev) => ({
          ...prev,
          solvedCellIds: [...prev.solvedCellIds, selectedCell.id],
        }))
        setTimeout(() => {
          setSelectedCell(null)
          setShowFireworks(false)
          setActiveSoundUrl(undefined)
        }, 2800)
      } else {
        setWrongPick(photoId)
        setHintVisible(true)
      }
    },
    [selectedCell, puzzle.celebrationSoundUrl]
  )

  const handleCloseOverlay = useCallback(() => {
    setSelectedCell(null)
    setHintVisible(false)
    setWrongPick(null)
  }, [])

  const handleRestart = useCallback(() => {
    setProgress({ puzzleId: puzzle.id, solvedCellIds: [] })
    setHasGuessed(false)
    setShuffledCells(shuffle(puzzle.cells))
    setShuffledPhotos(shuffle(puzzle.photos.filter((p) => p.url)))
    localStorage.removeItem(`progress-${puzzle.id}`)
  }, [puzzle.id, puzzle.cells, puzzle.photos])

  const getPhotoForCell = (cell: PuzzleCell) =>
    puzzle.photos.find((p) => p.id === cell.correctPhotoId)

  return (
    <div className="puzzle-board">
      <header className="puzzle-header">
        <div className="puzzle-header-left">
          {onBack && (
            <button className="back-btn" onClick={onBack}>
              ← Back
            </button>
          )}
        </div>
        <div className="puzzle-header-center">
          <h1>🧩 {puzzle.name}</h1>
          <p className="puzzle-subtitle">
            Tap a puzzle piece to reveal the clue!
          </p>
        </div>
        <div className="puzzle-header-right">
          <span className="score-badge">
            {progress.solvedCellIds.length}/{completeCells.length} ⭐
          </span>
        </div>
      </header>

      <div className="jigsaw-grid">
        {shuffledCells.map((cell, index) => {
          const row = Math.floor(index / 3)
          const col = index % 3
          const solved = progress.solvedCellIds.includes(cell.id)
          const photo = getPhotoForCell(cell)
          const complete = isCellComplete(cell, puzzle.photos)
          return (
            <JigsawPiece
              key={cell.id}
              row={row}
              col={col}
              size={pieceSize}
              solved={solved}
              onClick={() => handleCellClick(cell)}
              disabled={solved || !complete}
              testId={`puzzle-cell-${index}`}
            >
              {solved && photo ? (
                <div className="solved-content">
                  <img src={photo.url} alt={photo.label} />
                  <span className="solved-label">{photo.label}</span>
                </div>
              ) : !complete ? (
                <div className="placeholder-content">
                  <img src={generatePlaceholder(index)} alt="Coming soon" />
                </div>
              ) : (
                <div className="unsolved-content">
                  <span className="piece-number">{index + 1}</span>
                  <span className="piece-icon">❓</span>
                </div>
              )}
            </JigsawPiece>
          )
        })}
      </div>

      {hasGuessed && !allSolved && (
        <div className="replay-bar">
          <button className="replay-btn" onClick={handleRestart}>
            🔄 Replay
          </button>
        </div>
      )}

      {allSolved && completeCells.length > 0 && (
        <div className="celebration-banner" data-testid="celebration">
          <h2>🎉 You solved the whole puzzle! 🎉</h2>
          <p>Amazing job, adventurer!</p>
          <button className="restart-btn" onClick={handleRestart}>
            🔄 Play Again
          </button>
        </div>
      )}

      {selectedCell && !showFireworks && (
        <div className="overlay" data-testid="overlay">
          <div className="overlay-content">
            <button
              className="overlay-close"
              onClick={handleCloseOverlay}
              data-testid="overlay-close"
            >
              ✕
            </button>
            <div className="clue-box">
              <h2>🔍 Clue</h2>
              <p className="clue-text">{selectedCell.clue}</p>
              {hintVisible && (
                <div className="hint-box" data-testid="hint">
                  <strong>💡 Hint:</strong> {selectedCell.hint}
                </div>
              )}
            </div>
            <PhotoGrid
              photos={shuffledPhotos}
              onSelect={handlePhotoSelect}
              wrongPick={wrongPick}
              solvedPhotoIds={progress.solvedCellIds
                .map((cid) => puzzle.cells.find((c) => c.id === cid)?.correctPhotoId)
                .filter(Boolean) as string[]}
            />
          </div>
        </div>
      )}

      <Fireworks
        active={showFireworks}
        duration={2500}
        soundUrl={activeSoundUrl}
        onComplete={() => setShowFireworks(false)}
      />
    </div>
  )
}
