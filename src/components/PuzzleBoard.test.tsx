import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import PuzzleBoard from './PuzzleBoard'
import type { Puzzle } from '../types'

const testPuzzle: Puzzle = {
  id: 'test-puzzle',
  name: 'Test Puzzle',
  cells: [
    { id: 'c1', clue: 'Find the cat', hint: 'It meows!', correctPhotoId: 'p1' },
    { id: 'c2', clue: 'Find the dog', hint: 'It barks!', correctPhotoId: 'p2' },
    { id: 'c3', clue: 'Find the bird', hint: 'It flies!', correctPhotoId: 'p3' },
    { id: 'c4', clue: 'Find the fish', hint: 'It swims!', correctPhotoId: 'p4' },
    { id: 'c5', clue: 'Find the horse', hint: 'It gallops!', correctPhotoId: 'p5' },
    { id: 'c6', clue: 'Find the cow', hint: 'It moos!', correctPhotoId: 'p6' },
    { id: 'c7', clue: 'Find the pig', hint: 'It oinks!', correctPhotoId: 'p7' },
    { id: 'c8', clue: 'Find the duck', hint: 'It quacks!', correctPhotoId: 'p8' },
    { id: 'c9', clue: 'Find the sheep', hint: 'It baas!', correctPhotoId: 'p9' },
  ],
  photos: [
    { id: 'p1', url: 'cat.jpg', label: 'Cat' },
    { id: 'p2', url: 'dog.jpg', label: 'Dog' },
    { id: 'p3', url: 'bird.jpg', label: 'Bird' },
    { id: 'p4', url: 'fish.jpg', label: 'Fish' },
    { id: 'p5', url: 'horse.jpg', label: 'Horse' },
    { id: 'p6', url: 'cow.jpg', label: 'Cow' },
    { id: 'p7', url: 'pig.jpg', label: 'Pig' },
    { id: 'p8', url: 'duck.jpg', label: 'Duck' },
    { id: 'p9', url: 'sheep.jpg', label: 'Sheep' },
  ],
  createdAt: new Date().toISOString(),
}

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

describe('PuzzleBoard', () => {
  it('renders 9 puzzle cells', () => {
    render(<PuzzleBoard puzzle={testPuzzle} />)
    for (let i = 0; i < 9; i++) {
      expect(screen.getByTestId(`puzzle-cell-${i}`)).toBeInTheDocument()
    }
  })

  it('shows the puzzle name', () => {
    render(<PuzzleBoard puzzle={testPuzzle} />)
    expect(screen.getByText('Test Puzzle', { exact: false })).toBeInTheDocument()
  })

  it('opens overlay with clue when a cell is clicked', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    render(<PuzzleBoard puzzle={testPuzzle} />)

    await user.click(screen.getByTestId('puzzle-cell-0'))

    expect(screen.getByTestId('overlay')).toBeInTheDocument()
    expect(screen.getByText('Find the cat')).toBeInTheDocument()
  })

  it('shows hint on wrong answer', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    render(<PuzzleBoard puzzle={testPuzzle} />)

    await user.click(screen.getByTestId('puzzle-cell-0'))
    await user.click(screen.getByTestId('photo-p2'))

    expect(screen.getByTestId('hint')).toBeInTheDocument()
    expect(screen.getByText('It meows!', { exact: false })).toBeInTheDocument()
  })

  it('solves a cell on correct answer and shows fireworks', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    render(<PuzzleBoard puzzle={testPuzzle} />)

    await user.click(screen.getByTestId('puzzle-cell-0'))
    await user.click(screen.getByTestId('photo-p1'))

    await act(async () => {
      await new Promise((r) => setTimeout(r, 3000))
    })

    expect(screen.queryByTestId('overlay')).not.toBeInTheDocument()
    expect(screen.getByText('1/9', { exact: false })).toBeInTheDocument()
  })

  it('closes overlay when close button is clicked', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    render(<PuzzleBoard puzzle={testPuzzle} />)

    await user.click(screen.getByTestId('puzzle-cell-0'))
    expect(screen.getByTestId('overlay')).toBeInTheDocument()

    await user.click(screen.getByTestId('overlay-close'))
    expect(screen.queryByTestId('overlay')).not.toBeInTheDocument()
  })
})
