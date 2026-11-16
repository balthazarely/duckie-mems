import { useState, useRef, useEffect } from 'react'

export function Lightbox({
  isOpen,
  images,
  initialIndex = 0,
  onClose,
}: {
  isOpen: boolean
  images: string[]
  initialIndex?: number
  onClose: () => void
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex, isOpen])
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  if (!isOpen || images.length === 0) return null

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
    if (e.key === 'Escape') onClose()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX
    handleSwipe()
  }

  const handleSwipe = () => {
    const swipeThreshold = 50
    const diff = touchStartX.current - touchEndX.current

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        goToNext()
      } else {
        goToPrevious()
      }
    }
  }

  const isMobile = window.innerWidth < 768

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: isMobile ? '0.5rem' : '1rem',
      }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
    >
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          background: 'rgba(255, 255, 255, 0.3)',
          color: 'white',
          border: 'none',
          padding: '0.8rem 1.2rem',
          fontSize: '1.5rem',
          cursor: 'pointer',
          borderRadius: '4px',
          minHeight: '44px',
          minWidth: '44px',
          zIndex: 2001,
        }}
      >
        ✕
      </button>

      <img
        src={images[currentIndex]}
        alt={`Image ${currentIndex + 1}`}
        style={{
          maxWidth: isMobile ? '90vw' : '80vw',
          maxHeight: isMobile ? '60vh' : '80vh',
          objectFit: 'contain',
          borderRadius: '4px',
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginTop: isMobile ? '1.5rem' : '2rem',
            justifyContent: 'center',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={goToPrevious}
            style={{
              background: 'rgba(255, 255, 255, 0.3)',
              color: 'white',
              border: 'none',
              padding: '0.8rem 1.2rem',
              fontSize: '1.5rem',
              cursor: 'pointer',
              borderRadius: '4px',
              minHeight: '44px',
              minWidth: '44px',
            }}
          >
            ◀
          </button>

          <button
            onClick={goToNext}
            style={{
              background: 'rgba(255, 255, 255, 0.3)',
              color: 'white',
              border: 'none',
              padding: '0.8rem 1.2rem',
              fontSize: '1.5rem',
              cursor: 'pointer',
              borderRadius: '4px',
              minHeight: '44px',
              minWidth: '44px',
            }}
          >
            ▶
          </button>
        </div>
      )}

      {images.length > 1 && (
        <div
          style={{
            marginTop: '1rem',
            color: 'white',
            fontSize: '0.85rem',
          }}
        >
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  )
}
