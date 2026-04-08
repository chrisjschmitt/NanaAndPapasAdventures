import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Puzzle, PuzzleCell, GameProgress } from '../types'
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

export default function PuzzleBoard({ puzzle, onBack }: PuzzleBoardProps) {
  const [progress, setProgress] = useState<GameProgress>(() =>
    loadProgress(puzzle.id)
  )
  const [selectedCell, setSelectedCell] = useState<PuzzleCell | null>(null)
  const [hintVisible, setHintVisible] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)
  const [wrongPick, setWrongPick] = useState<string | null>(null)
  const [pieceSize, setPieceSize] = useState(140)

  const allSolved = useMemo(
    () =>
      puzzle.cells.length > 0 &&
      progress.solvedCellIds.length === puzzle.cells.length,
    [progress.solvedCellIds.length, puzzle.cells.length]
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
      setSelectedCell(cell)
      setHintVisible(false)
      setWrongPick(null)
    },
    [progress.solvedCellIds]
  )

  const handlePhotoSelect = useCallback(
    (photoId: string) => {
      if (!selectedCell) return

      if (photoId === selectedCell.correctPhotoId) {
        setShowFireworks(true)
        setProgress((prev) => ({
          ...prev,
          solvedCellIds: [...prev.solvedCellIds, selectedCell.id],
        }))
        setTimeout(() => {
          setSelectedCell(null)
          setShowFireworks(false)
        }, 2800)
      } else {
        setWrongPick(photoId)
        setHintVisible(true)
      }
    },
    [selectedCell]
  )

  const handleCloseOverlay = useCallback(() => {
    setSelectedCell(null)
    setHintVisible(false)
    setWrongPick(null)
  }, [])

  const handleRestart = useCallback(() => {
    setProgress({ puzzleId: puzzle.id, solvedCellIds: [] })
    localStorage.removeItem(`progress-${puzzle.id}`)
  }, [puzzle.id])

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
            {progress.solvedCellIds.length}/{puzzle.cells.length} ⭐
          </span>
        </div>
      </header>

      <div className="jigsaw-grid">
        {puzzle.cells.map((cell, index) => {
          const row = Math.floor(index / 3)
          const col = index % 3
          const solved = progress.solvedCellIds.includes(cell.id)
          const photo = getPhotoForCell(cell)
          return (
            <JigsawPiece
              key={cell.id}
              row={row}
              col={col}
              size={pieceSize}
              solved={solved}
              onClick={() => handleCellClick(cell)}
              disabled={solved}
              testId={`puzzle-cell-${index}`}
            >
              {solved && photo ? (
                <div className="solved-content">
                  <img src={photo.url} alt={photo.label} />
                  <span className="solved-label">{photo.label}</span>
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

      {allSolved && (
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
              photos={puzzle.photos}
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
        onComplete={() => setShowFireworks(false)}
      />
    </div>
  )
}
