import type { Puzzle } from '../types'
import './PuzzleSelector.css'

interface PuzzleSelectorProps {
  puzzles: Puzzle[]
  onSelect: (puzzle: Puzzle) => void
  onAdmin: () => void
}

function countReady(puzzle: Puzzle): number {
  return puzzle.cells.filter((c) => {
    const photo = puzzle.photos.find((p) => p.id === c.correctPhotoId)
    return c.clue.trim() && c.hint.trim() && photo?.url
  }).length
}

export default function PuzzleSelector({
  puzzles,
  onSelect,
  onAdmin,
}: PuzzleSelectorProps) {
  return (
    <div className="puzzle-selector">
      <header className="selector-header">
        <h1>✈️ Nana & Papa's Adventures</h1>
        <p>Choose a puzzle to play!</p>
      </header>

      <div className="puzzle-list">
        {puzzles.map((puzzle) => {
          const ready = countReady(puzzle)
          const isComplete = ready >= 9 && puzzle.cells.length >= 9
          return (
            <button
              key={puzzle.id}
              className={`puzzle-card ${!isComplete ? 'puzzle-card-wip' : ''}`}
              onClick={() => onSelect(puzzle)}
              data-testid={`puzzle-${puzzle.id}`}
            >
              <span className="puzzle-card-icon">{isComplete ? '🧩' : '🚧'}</span>
              <div className="puzzle-card-text">
                <span className="puzzle-card-name">{puzzle.name || 'Untitled'}</span>
                {!isComplete && (
                  <span className="puzzle-card-wip-label">Under Construction</span>
                )}
              </div>
              <span className="puzzle-card-count">
                {ready} piece{ready !== 1 ? 's' : ''} ready
              </span>
            </button>
          )
        })}
      </div>

      <button className="admin-link" onClick={onAdmin} data-testid="admin-btn">
        ⚙️ Admin
      </button>
    </div>
  )
}
