export interface Destination {
  id: string
  name: string
  emoji: string
  description: string
  funFact: string
  souvenir: string
}

export interface GameState {
  currentDestinationIndex: number
  visitedDestinations: string[]
  souvenirs: string[]
  score: number
}
