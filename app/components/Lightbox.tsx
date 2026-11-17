'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import 'yet-another-react-lightbox/styles.css'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'

const LightboxLib = dynamic(() => import('yet-another-react-lightbox').then(mod => mod.default), {
  ssr: false,
  loading: () => null,
})

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
  if (!isOpen || images.length === 0) return null

  const slides = images.map((src) => ({ src }))

  return (
    <Suspense fallback={null}>
      <LightboxLib
        open={isOpen}
        close={onClose}
        slides={slides}
        index={initialIndex}
        plugins={[Zoom]}
        zoom={{ maxZoomPixelRatio: 4 }}
        styles={{
          container: { backgroundColor: 'rgba(0, 0, 0, 0.95)' },
        }}
      />
    </Suspense>
  )
}
