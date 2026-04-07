import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import TravelGame from './TravelGame'
import { destinations } from '../data/destinations'

describe('TravelGame', () => {
  it('renders the game header', () => {
    render(<TravelGame />)
    expect(
      screen.getByText("Nana & Papa's Adventures", { exact: false })
    ).toBeInTheDocument()
  })

  it('shows the first destination', () => {
    render(<TravelGame />)
    expect(screen.getByText(destinations[0].name)).toBeInTheDocument()
    expect(screen.getByText(destinations[0].description)).toBeInTheDocument()
  })

  it('shows a visit button for unvisited destinations', () => {
    render(<TravelGame />)
    expect(screen.getByTestId('visit-btn')).toBeInTheDocument()
  })

  it('reveals fun fact and souvenir on visit', async () => {
    const user = userEvent.setup()
    render(<TravelGame />)

    await user.click(screen.getByTestId('visit-btn'))

    expect(screen.getByTestId('fun-fact')).toBeInTheDocument()
    expect(
      screen.getByText(destinations[0].funFact, { exact: false })
    ).toBeInTheDocument()
    expect(screen.getByTestId('souvenirs-bar')).toBeInTheDocument()
  })

  it('navigates to the next destination after visiting', async () => {
    const user = userEvent.setup()
    render(<TravelGame />)

    await user.click(screen.getByTestId('visit-btn'))
    await user.click(screen.getByTestId('next-btn'))

    await screen.findByText(destinations[1].name)
  })

  it('shows celebration when all destinations are visited', async () => {
    const user = userEvent.setup()
    render(<TravelGame />)

    for (let i = 0; i < destinations.length; i++) {
      await user.click(screen.getByTestId('visit-btn'))
      if (i < destinations.length - 1) {
        await user.click(screen.getByTestId('next-btn'))
        await screen.findByText(destinations[i + 1].name)
      }
    }

    expect(
      screen.getByText('Amazing Journey Complete!', { exact: false })
    ).toBeInTheDocument()

    const souvenirs = screen.getAllByTestId('souvenir')
    expect(souvenirs).toHaveLength(destinations.length)
  })

  it('can restart after completing the game', async () => {
    const user = userEvent.setup()
    render(<TravelGame />)

    for (let i = 0; i < destinations.length; i++) {
      await user.click(screen.getByTestId('visit-btn'))
      if (i < destinations.length - 1) {
        await user.click(screen.getByTestId('next-btn'))
        await screen.findByText(destinations[i + 1].name)
      }
    }

    await user.click(screen.getByText('Travel Again!', { exact: false }))

    expect(screen.getByText(destinations[0].name)).toBeInTheDocument()
    expect(screen.getByTestId('visit-btn')).toBeInTheDocument()
  })
})
