import { useState, useEffect, useCallback } from 'react'
import type { Puzzle } from './types'
import { defaultPuzzle } from './data/defaultPuzzle'
import PuzzleSelector from './components/PuzzleSelector'
import PuzzleBoard from './components/PuzzleBoard'
import AdminPanel from './components/AdminPanel'
import './App.css'

type View = 'selector' | 'game' | 'admin'

async function loadPuzzlesFromApi(): Promise<Puzzle[]> {
  try {
    const res = await fetch('/api/puzzles', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) return data
    }
  } catch {
    // API not available (local dev without Vercel)
  }
  return [defaultPuzzle]
}

function App() {
  const [view, setView] = useState<View>('selector')
  const [puzzles, setPuzzles] = useState<Puzzle[]>([])
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)

  const loadPuzzles = useCallback(async () => {
    const data = await loadPuzzlesFromApi()
    setPuzzles(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    loadPuzzlesFromApi().then((data) => {
      if (!cancelled) {
        setPuzzles(data)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  const handleSelectPuzzle = useCallback((puzzle: Puzzle) => {
    setActivePuzzle(puzzle)
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
