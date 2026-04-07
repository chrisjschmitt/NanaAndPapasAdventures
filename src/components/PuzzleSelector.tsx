import type { Puzzle } from '../types'
import './PuzzleSelector.css'

interface PuzzleSelectorProps {
  puzzles: Puzzle[]
  onSelect: (puzzle: Puzzle) => void
  onAdmin: () => void
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
        {puzzles.map((puzzle) => (
          <button
            key={puzzle.id}
            className="puzzle-card"
            onClick={() => onSelect(puzzle)}
            data-testid={`puzzle-${puzzle.id}`}
          >
            <span className="puzzle-card-icon">🧩</span>
            <span className="puzzle-card-name">{puzzle.name}</span>
            <span className="puzzle-card-count">
              {puzzle.cells.length} pieces
            </span>
          </button>
        ))}
      </div>

      <button className="admin-link" onClick={onAdmin} data-testid="admin-btn">
        ⚙️ Admin
      </button>
    </div>
  )
}
