export interface Photo {
  id: string
  url: string
  pathname: string
  label: string
}

export interface PuzzleCell {
  id: string
  clue: string
  hint: string
  correctPhotoId: string
  soundUrl?: string
  soundPathname?: string
}

export interface Puzzle {
  id: string
  name: string
  cells: PuzzleCell[]
  photos: Photo[]
  celebrationSoundUrl?: string
  celebrationSoundPathname?: string
  prizeImageUrl?: string
  prizeImagePathname?: string
  createdAt: string
}

export interface GameProgress {
  puzzleId: string
  solvedCellIds: string[]
}
