import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { Puzzle, PuzzleCell, Photo, GameProgress } from '../types'
import PhotoGrid from './PhotoGrid'
import { ensureAudioContext, playCustomSound, playFireworksSound } from '../lib/fireworksSound'
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

function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function pickRound(cells: PuzzleCell[], photos: Photo[]): { cells: PuzzleCell[]; photos: Photo[] } {
  const complete = cells.filter((c) => isCellComplete(c, photos))
  const picked = shuffle(complete).slice(0, 9)
  const pickedPhotoIds = new Set(picked.map((c) => c.correctPhotoId))
  const pickedPhotos = photos.filter((p) => pickedPhotoIds.has(p.id))
  return { cells: shuffle(picked), photos: shuffle(pickedPhotos) }
}

const TILE_COLORS = [
  'linear-gradient(135deg, #ff6b6b, #ee5a24)',
  'linear-gradient(135deg, #ffd166, #f7b731)',
  'linear-gradient(135deg, #06d6a0, #1dd1a1)',
  'linear-gradient(135deg, #118ab2, #0abde3)',
  'linear-gradient(135deg, #6a4c93, #a55eea)',
  'linear-gradient(135deg, #ef476f, #e84393)',
  'linear-gradient(135deg, #ff9f43, #f39c12)',
  'linear-gradient(135deg, #00cec9, #55efc4)',
  'linear-gradient(135deg, #fd79a8, #e17055)',
]

export default function PuzzleBoard({ puzzle, onBack }: PuzzleBoardProps) {
  const [progress, setProgress] = useState<GameProgress>(() =>
    loadProgress(puzzle.id)
  )
  const [selectedCell, setSelectedCell] = useState<PuzzleCell | null>(null)
  const [hintVisible, setHintVisible] = useState(false)
  const [recentlySolved, setRecentlySolved] = useState<string | null>(null)
  const [wrongPick, setWrongPick] = useState<string | null>(null)
  const [hasGuessed, setHasGuessed] = useState(false)
  const [tappedPhoto, setTappedPhoto] = useState<Photo | null>(null)
  const [gridSize, setGridSize] = useState(300)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [round, setRound] = useState(() => pickRound(puzzle.cells, puzzle.photos))

  const completeCells = round.cells

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
      if (!wrapperRef.current) return
      const w = wrapperRef.current.clientWidth
      const h = wrapperRef.current.clientHeight
      setGridSize(Math.floor(Math.min(w, h)))
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const handleCellClick = useCallback(
    (cell: PuzzleCell) => {
      if (progress.solvedCellIds.includes(cell.id)) {
        const photo = round.photos.find((p) => p.id === cell.correctPhotoId)
        if (photo) setTappedPhoto(photo)
        return
      }
      if (!isCellComplete(cell, round.photos)) return
      ensureAudioContext()
      setSelectedCell(cell)
      setHintVisible(false)
      setWrongPick(null)
    },
    [progress.solvedCellIds, round.photos]
  )

  const handlePhotoSelect = useCallback(
    (photoId: string) => {
      if (!selectedCell) return
      setHasGuessed(true)

      if (photoId === selectedCell.correctPhotoId) {
        const solvedCellId = selectedCell.id
        const cellSound = selectedCell.soundUrl || puzzle.celebrationSoundUrl
        if (cellSound) {
          playCustomSound(cellSound)
        } else {
          playFireworksSound(2500)
        }
        setSelectedCell(null)
        setRecentlySolved(solvedCellId)
        setProgress((prev) => ({
          ...prev,
          solvedCellIds: [...prev.solvedCellIds, solvedCellId],
        }))
        setTimeout(() => setRecentlySolved(null), 1200)
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
    setRound(pickRound(puzzle.cells, puzzle.photos))
    localStorage.removeItem(`progress-${puzzle.id}`)
  }, [puzzle.id, puzzle.cells, puzzle.photos])

  const gap = 4
  const cellSize = Math.floor((gridSize - gap * 4) / 3)
  const hasPrize = !!puzzle.prizeImageUrl

  return (
    <div className="reveal-board">
      <header className="reveal-header">
        <div className="reveal-header-left">
          {onBack && (
            <button className="reveal-back-btn" onClick={onBack}>←</button>
          )}
        </div>
        <div className="reveal-header-center">
          <h1>{puzzle.name}</h1>
        </div>
        <div className="reveal-header-right">
          <span className="reveal-score">
            {progress.solvedCellIds.length}/{completeCells.length} ⭐
          </span>
        </div>
      </header>

      <div className="reveal-grid-wrapper" ref={wrapperRef}>
        <div
          className={`reveal-grid ${allSolved ? 'all-solved' : ''}`}
          style={{
            width: gridSize,
            height: gridSize,
            gap: allSolved ? 0 : gap,
            padding: allSolved ? 0 : gap,
          }}
        >
          {round.cells.map((cell, index) => {
            const row = Math.floor(index / 3)
            const col = index % 3
            const solved = progress.solvedCellIds.includes(cell.id)
            const complete = isCellComplete(cell, round.photos)
            const isRecent = recentlySolved === cell.id

            const innerSize = allSolved ? gridSize / 3 : cellSize
            const prizeSliceStyle = hasPrize
              ? {
                  backgroundImage: `url(${puzzle.prizeImageUrl})`,
                  backgroundSize: `${allSolved ? gridSize : gridSize - gap * 2}px ${allSolved ? gridSize : gridSize - gap * 2}px`,
                  backgroundPosition: allSolved
                    ? `-${col * innerSize}px -${row * innerSize}px`
                    : `-${col * (cellSize + gap)}px -${row * (cellSize + gap)}px`,
                }
              : undefined

            return (
              <button
                key={cell.id}
                className={`reveal-tile ${solved ? 'revealed' : ''} ${!complete ? 'incomplete' : ''} ${isRecent ? 'recently-solved' : ''}`}
                onClick={() => handleCellClick(cell)}
                disabled={!complete && !solved}
                data-testid={`puzzle-cell-${index}`}
                style={{ width: innerSize, height: innerSize }}
              >
                {hasPrize && (
                  <div
                    className="tile-prize-slice"
                    style={prizeSliceStyle}
                  />
                )}

                {complete && (
                  <div
                    className="tile-cover"
                    style={{ background: TILE_COLORS[index % TILE_COLORS.length] }}
                  >
                    <span className="tile-question">?</span>
                  </div>
                )}

                {!complete && (
                  <div className="tile-cover tile-cover-incomplete">
                    <span className="tile-coming-soon">🚧</span>
                  </div>
                )}

                {solved && !hasPrize && (
                  <div className="tile-solved-no-prize">✅</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {hasGuessed && !allSolved && (
        <div className="reveal-replay-bar">
          <button className="replay-btn" onClick={handleRestart}>🔄 Replay</button>
        </div>
      )}

      {allSolved && completeCells.length > 0 && (
        <div className="reveal-celebration" data-testid="celebration">
          <h2>🎉 You solved it! 🎉</h2>
          <p>Tap the picture to explore each piece!</p>
          <button className="restart-btn" onClick={handleRestart}>🔄 Play Again</button>
        </div>
      )}

      {selectedCell && (
        <div className="overlay" data-testid="overlay">
          <div className="overlay-content">
            <button className="overlay-close" onClick={handleCloseOverlay} data-testid="overlay-close">✕</button>
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
              photos={round.photos}
              onSelect={handlePhotoSelect}
              wrongPick={wrongPick}
              solvedPhotoIds={progress.solvedCellIds
                .map((cid) => puzzle.cells.find((c) => c.id === cid)?.correctPhotoId)
                .filter(Boolean) as string[]}
            />
          </div>
        </div>
      )}

      {tappedPhoto && (
        <div className="photo-zoom-overlay" onClick={() => setTappedPhoto(null)}>
          <div className="photo-zoom-content" onClick={(e) => e.stopPropagation()}>
            <img src={tappedPhoto.url} alt={tappedPhoto.label} />
            <p className="photo-zoom-label">{tappedPhoto.label}</p>
            <button className="photo-zoom-close" onClick={() => setTappedPhoto(null)}>✕ Close</button>
          </div>
        </div>
      )}

    </div>
  )
}
