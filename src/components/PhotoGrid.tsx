import type { Photo } from '../types'
import './PhotoGrid.css'

interface PhotoGridProps {
  photos: Photo[]
  onSelect: (photoId: string) => void
  wrongPick: string | null
  solvedPhotoIds: string[]
}

export default function PhotoGrid({
  photos,
  onSelect,
  wrongPick,
  solvedPhotoIds,
}: PhotoGridProps) {
  return (
    <div className="photo-grid">
      {photos.map((photo) => {
        const isSolved = solvedPhotoIds.includes(photo.id)
        const isWrong = wrongPick === photo.id
        return (
          <button
            key={photo.id}
            className={`photo-cell ${isSolved ? 'used' : ''} ${isWrong ? 'wrong-shake' : ''}`}
            onClick={() => !isSolved && onSelect(photo.id)}
            disabled={isSolved}
            data-testid={`photo-${photo.id}`}
          >
            <img src={photo.url} alt={photo.label} />
            <span className="photo-label">{photo.label}</span>
            {isSolved && <div className="used-overlay">✅</div>}
          </button>
        )
      })}
    </div>
  )
}
