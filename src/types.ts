export interface PhotoMeta {
  id: string
  url: string
  label: string
  description: string
}

export interface Photo {
  id: string
  url: string
  label: string
}

export interface PuzzleCell {
  id: string
  clue: string
  hint: string
  correctPhotoId: string
}

export interface Puzzle {
  id: string
  name: string
  cells: PuzzleCell[]
  photos: Photo[]
  createdAt: string
}

export interface GameProgress {
  puzzleId: string
  solvedCellIds: string[]
}
