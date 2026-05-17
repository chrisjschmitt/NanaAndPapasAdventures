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

function getInitialRoute(): { view: View; puzzleId: string | null } {
  const path = window.location.pathname
  const playMatch = path.match(/^\/play\/(.+)$/)
  if (playMatch) return { view: 'game', puzzleId: decodeURIComponent(playMatch[1]) }
  if (path === '/admin') return { view: 'admin', puzzleId: null }
  return { view: 'selector', puzzleId: null }
}

function App() {
  const [route] = useState(getInitialRoute)
  const [view, setView] = useState<View>(route.view)
  const [puzzles, setPuzzles] = useState<Puzzle[]>([])
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)

  const loadPuzzles = useCallback(async () => {
    const data = await loadPuzzlesFromApi()
    setPuzzles(data)
    setLoading(false)
    return data
  }, [])

  useEffect(() => {
    let cancelled = false
    loadPuzzlesFromApi().then((data) => {
      if (cancelled) return
      setPuzzles(data)
      setLoading(false)

      if (route.view === 'game' && route.puzzleId) {
        const found = data.find((p) => p.id === route.puzzleId)
        if (found) setActivePuzzle(found)
        else setView('selector')
      }
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectPuzzle = useCallback((puzzle: Puzzle) => {
    setActivePuzzle(puzzle)
    setView('game')
    window.history.pushState(null, '', `/play/${encodeURIComponent(puzzle.id)}`)
  }, [])

  const handleBack = useCallback(() => {
    setView('selector')
    setActivePuzzle(null)
    window.history.pushState(null, '', '/')
    loadPuzzles()
  }, [loadPuzzles])

  useEffect(() => {
    function onPopState() {
      const r = getInitialRoute()
      if (r.view === 'game' && r.puzzleId) {
        const found = puzzles.find((p) => p.id === r.puzzleId)
        if (found) { setActivePuzzle(found); setView('game'); return }
      }
      setView(r.view)
      if (r.view !== 'game') setActivePuzzle(null)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [puzzles])

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
      onAdmin={() => {
        setView('admin')
        window.history.pushState(null, '', '/admin')
      }}
    />
  )
}

export default App
