import { useState } from 'react'
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
  const [zoomedPhoto, setZoomedPhoto] = useState<Photo | null>(null)

  return (
    <>
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
              <div className="photo-cell-footer">
                <span className="photo-label">{photo.label}</span>
                {!isSolved && (
                  <button
                    className="zoom-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setZoomedPhoto(photo)
                    }}
                    title="Zoom in"
                  >
                    🔍
                  </button>
                )}
              </div>
              {isSolved && <div className="used-overlay">✅</div>}
            </button>
          )
        })}
      </div>

      {zoomedPhoto && (
        <div
          className="photo-zoom-overlay"
          onClick={() => setZoomedPhoto(null)}
          data-testid="photo-zoom"
        >
          <div className="photo-zoom-content" onClick={(e) => e.stopPropagation()}>
            <img src={zoomedPhoto.url} alt={zoomedPhoto.label} />
            <p className="photo-zoom-label">{zoomedPhoto.label}</p>
            <button className="photo-zoom-close" onClick={() => setZoomedPhoto(null)}>
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
