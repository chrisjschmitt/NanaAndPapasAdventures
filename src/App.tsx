import { useState, useEffect, useCallback } from 'react'
import type { Puzzle } from './types'
import { getPuzzles, savePuzzle, getPuzzle } from './lib/storage'
import { defaultPuzzle } from './data/defaultPuzzle'
import PuzzleSelector from './components/PuzzleSelector'
import PuzzleBoard from './components/PuzzleBoard'
import AdminPanel from './components/AdminPanel'
import './App.css'

type View = 'selector' | 'game' | 'admin'

function App() {
  const [view, setView] = useState<View>('selector')
  const [puzzles, setPuzzles] = useState<Puzzle[]>([])
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)

  const loadPuzzles = useCallback(async () => {
    try {
      let stored = await getPuzzles()

      if (stored.length === 0) {
        await savePuzzle(defaultPuzzle)
        stored = [defaultPuzzle]
      }

      setPuzzles(stored)
    } catch {
      setPuzzles([defaultPuzzle])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPuzzles()
  }, [loadPuzzles])

  const handleSelectPuzzle = useCallback(async (puzzle: Puzzle) => {
    const fresh = await getPuzzle(puzzle.id)
    setActivePuzzle(fresh ?? puzzle)
    setView('game')
  }, [])

  const handleBack = useCallback(() => {
    setView('selector')
    setActivePuzzle(null)
    loadPuzzles()
  }, [loadPuzzles])

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="loading-icon">🧩</span>
        <p>Loading adventures...</p>
      </div>
    )
  }

  if (view === 'admin') {
    return <AdminPanel onBack={handleBack} onPuzzlesChanged={loadPuzzles} />
  }

  if (view === 'game' && activePuzzle) {
    return <PuzzleBoard puzzle={activePuzzle} onBack={handleBack} />
  }

  return (
    <PuzzleSelector
      puzzles={puzzles}
      onSelect={handleSelectPuzzle}
      onAdmin={() => setView('admin')}
    />
  )
}

export default App
