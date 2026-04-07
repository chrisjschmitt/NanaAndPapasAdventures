import { useState, useCallback } from 'react'
import { destinations } from '../data/destinations'
import type { GameState } from '../types'
import './TravelGame.css'

const initialState: GameState = {
  currentDestinationIndex: 0,
  visitedDestinations: [],
  souvenirs: [],
  score: 0,
}

export default function TravelGame() {
  const [game, setGame] = useState<GameState>(initialState)
  const [showFact, setShowFact] = useState(false)
  const [animating, setAnimating] = useState(false)

  const currentDestination = destinations[game.currentDestinationIndex]
  const isFinished = game.visitedDestinations.length === destinations.length
  const alreadyVisited = game.visitedDestinations.includes(currentDestination?.id)

  const handleVisit = useCallback(() => {
    if (!currentDestination || alreadyVisited) return
    setShowFact(true)
    setGame((prev) => ({
      ...prev,
      visitedDestinations: [...prev.visitedDestinations, currentDestination.id],
      souvenirs: [...prev.souvenirs, currentDestination.souvenir],
      score: prev.score + 10,
    }))
  }, [currentDestination, alreadyVisited])

  const handleNext = useCallback(() => {
    setAnimating(true)
    setShowFact(false)
    setTimeout(() => {
      setGame((prev) => ({
        ...prev,
        currentDestinationIndex:
          (prev.currentDestinationIndex + 1) % destinations.length,
      }))
      setAnimating(false)
    }, 300)
  }, [])

  const handleRestart = useCallback(() => {
    setGame(initialState)
    setShowFact(false)
    setAnimating(false)
  }, [])

  if (isFinished) {
    return (
      <div className="travel-game">
        <div className="game-card celebration">
          <h2>🎉 Amazing Journey Complete! 🎉</h2>
          <p>
            Nana and Papa visited all {destinations.length} destinations!
          </p>
          <div className="final-score">Score: {game.score} points</div>
          <div className="souvenirs-list">
            <h3>Souvenirs Collected:</h3>
            <div className="souvenir-grid">
              {game.souvenirs.map((s, i) => (
                <span key={i} className="souvenir-item" data-testid="souvenir">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <button className="game-btn restart-btn" onClick={handleRestart}>
            🔄 Travel Again!
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="travel-game">
      <header className="game-header">
        <h1>✈️ Nana & Papa's Adventures</h1>
        <p className="subtitle">Help them travel the world!</p>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${(game.visitedDestinations.length / destinations.length) * 100}%`,
            }}
          />
        </div>
        <div className="stats">
          <span>
            📍 {game.visitedDestinations.length}/{destinations.length} visited
          </span>
          <span>⭐ {game.score} points</span>
        </div>
      </header>

      <div className={`game-card ${animating ? 'slide-out' : 'slide-in'}`}>
        <div className="destination-emoji">{currentDestination.emoji}</div>
        <h2>{currentDestination.name}</h2>
        <p className="description">{currentDestination.description}</p>

        {showFact && (
          <div className="fun-fact" data-testid="fun-fact">
            <strong>🧠 Fun Fact:</strong> {currentDestination.funFact}
            <div className="souvenir-earned">
              <strong>🎁 Souvenir:</strong> {currentDestination.souvenir}
            </div>
          </div>
        )}

        <div className="button-group">
          {!alreadyVisited && (
            <button
              className="game-btn visit-btn"
              onClick={handleVisit}
              data-testid="visit-btn"
            >
              📸 Visit & Collect Souvenir!
            </button>
          )}
          {alreadyVisited && (
            <button
              className="game-btn next-btn"
              onClick={handleNext}
              data-testid="next-btn"
            >
              ✈️ Fly to Next Destination!
            </button>
          )}
        </div>
      </div>

      {game.souvenirs.length > 0 && (
        <div className="souvenirs-bar" data-testid="souvenirs-bar">
          <strong>🎒 Souvenirs:</strong>{' '}
          {game.souvenirs.map((s, i) => (
            <span key={i} className="souvenir-item">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
