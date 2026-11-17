'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Lightbox } from '@/app/components/Lightbox'
import { DuckLoader } from '@/app/components/DuckLoader'
import { supabase } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

const FAMILY_PHOTOS = [
  { id: '1', image_url: '/family gallery/anni-gallery-44.jpg', name: '' },
  { id: '2', image_url: '/family gallery/anni-gallery-15.jpg', name: '' },
  { id: '3', image_url: '/family gallery/anni-gallery-34.jpeg', name: '' },
  { id: '4', image_url: '/family gallery/anni-gallery-62.jpeg', name: '' },
  { id: '5', image_url: '/family gallery/anni-gallery-8.jpg', name: '' },
  { id: '6', image_url: '/family gallery/anni-gallery-11.jpg', name: '' },
  { id: '7', image_url: '/family gallery/anni-gallery-42.jpg', name: '' },
  { id: '8', image_url: '/family gallery/anni-gallery-17.jpg', name: '' },
  { id: '9', image_url: '/family gallery/anni-gallery-51.jpeg', name: '' },
  { id: '10', image_url: '/family gallery/anni-gallery-23.jpg', name: '' },
  { id: '11', image_url: '/family gallery/anni-gallery-33.jpeg', name: '' },
  { id: '12', image_url: '/family gallery/anni-gallery-68.jpeg', name: '' },
  { id: '13', image_url: '/family gallery/anni-gallery-39.jpg', name: '' },
  { id: '14', image_url: '/family gallery/anni-gallery-20.jpg', name: '' },
  { id: '15', image_url: '/family gallery/anni-gallery-41.jpg', name: '' },
  { id: '16', image_url: '/family gallery/anni-gallery-22.jpeg', name: '' },
  { id: '17', image_url: '/family gallery/anni-gallery-38.jpeg', name: '' },
  { id: '18', image_url: '/family gallery/anni-gallery-37.jpeg', name: '' },
  { id: '19', image_url: '/family gallery/anni-gallery-45.jpeg', name: '' },
  { id: '20', image_url: '/family gallery/anni-gallery-18.jpg', name: '' },
  { id: '21', image_url: '/family gallery/anni-gallery-25.jpg', name: '' },
  { id: '22', image_url: '/family gallery/anni-gallery-24.jpg', name: '' },
  { id: '23', image_url: '/family gallery/anni-gallery-63.jpeg', name: '' },
  { id: '24', image_url: '/family gallery/anni-gallery-66.jpeg', name: '' },
  { id: '25', image_url: '/family gallery/anni-gallery-14.jpg', name: '' },
  { id: '26', image_url: '/family gallery/anni-gallery-19.jpeg', name: '' },
  { id: '27', image_url: '/family gallery/anni-gallery-2.jpeg', name: '' },
  { id: '28', image_url: '/family gallery/anni-gallery-60.jpeg', name: '' },
  { id: '29', image_url: '/family gallery/anni-gallery-58.jpeg', name: '' },
  { id: '30', image_url: '/family gallery/anni-gallery-28.jpeg', name: '' },
  { id: '31', image_url: '/family gallery/anni-gallery-12.jpg', name: '' },
  { id: '32', image_url: '/family gallery/anni-gallery-7.jpg', name: '' },
  { id: '33', image_url: '/family gallery/anni-gallery-16.jpg', name: '' },
  { id: '34', image_url: '/family gallery/anni-gallery-48.jpeg', name: '' },
  { id: '35', image_url: '/family gallery/anni-gallery-13.jpeg', name: '' },
  { id: '36', image_url: '/family gallery/anni-gallery-4.jpg', name: '' },
  { id: '37', image_url: '/family gallery/anni-gallery-10.jpg', name: '' },
  { id: '38', image_url: '/family gallery/anni-gallery-46.JPG', name: '' },
  { id: '39', image_url: '/family gallery/anni-gallery-54.jpeg', name: '' },
  { id: '40', image_url: '/family gallery/anni-gallery-61.jpeg', name: '' },
  { id: '41', image_url: '/family gallery/anni-gallery-53.jpeg', name: '' },
  { id: '42', image_url: '/family gallery/anni-gallery-59.jpeg', name: '' },
  { id: '43', image_url: '/family gallery/anni-gallery-64.jpeg', name: '' },
  { id: '44', image_url: '/family gallery/anni-gallery-6.JPG', name: '' },
  { id: '45', image_url: '/family gallery/anni-gallery-9.jpeg', name: '' },
  { id: '46', image_url: '/family gallery/anni-gallery-35.jpeg', name: '' },
  { id: '47', image_url: '/family gallery/anni-gallery-27.jpg', name: '' },
  { id: '48', image_url: '/family gallery/anni-gallery-30.JPG', name: '' },
  { id: '49', image_url: '/family gallery/anni-gallery-43.jpg', name: '' },
  { id: '50', image_url: '/family gallery/anni-gallery-47.jpeg', name: '' },
  { id: '51', image_url: '/family gallery/anni-gallery-31.jpeg', name: '' },
  { id: '52', image_url: '/family gallery/anni-gallery-29.jpeg', name: '' },
  { id: '53', image_url: '/family gallery/anni-gallery-67.jpeg', name: '' },
  { id: '54', image_url: '/family gallery/anni-gallery-52.jpeg', name: '' },
  { id: '55', image_url: '/family gallery/anni-gallery-49.jpeg', name: '' },
  { id: '56', image_url: '/family gallery/anni-gallery-69.jpeg', name: '' },
  { id: '57', image_url: '/family gallery/anni-gallery-32.jpeg', name: '' },
  { id: '58', image_url: '/family gallery/anni-gallery-3.JPG', name: '' },
  { id: '59', image_url: '/family gallery/anni-gallery-55.jpeg', name: '' },
  { id: '60', image_url: '/family gallery/anni-gallery-1.jpeg', name: '' },
  { id: '61', image_url: '/family gallery/anni-gallery-65.jpeg', name: '' },
  { id: '62', image_url: '/family gallery/anni-gallery-5.JPG', name: '' },
  { id: '63', image_url: '/family gallery/anni-gallery-21.jpg', name: '' },
  { id: '64', image_url: '/family gallery/anni-gallery-57.jpeg', name: '' },
  { id: '65', image_url: '/family gallery/anni-gallery-26.JPG', name: '' },
  { id: '66', image_url: '/family gallery/anni-gallery-70.jpeg', name: '' },
]

interface GalleryPhoto {
  id: string
  image_id?: string
  image_url?: string
  name?: string
}

interface Post {
  id: string
  created_at: string
  name: string
  caption: string | null
  image_url: string | null
  image_urls: string[] | null
}

const MasonryGrid = ({
  photos,
  onImageClick,
}: {
  photos: any[]
  onImageClick: (images: string[], idx: number) => void
}) => (
  <div
    className="gallery-grid"
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1rem',
      padding: '0 1.5rem',
    }}
  >
    {photos.map((photo, idx) => (
      <button
        key={photo.id}
        onClick={() => {
          const images = photos.map((p) => p.image_url || `${supabaseUrl}/storage/v1/object/public/photos/${p.image_id}`)
          onImageClick(images, idx)
        }}
        style={{
          overflow: 'hidden',
          borderRadius: '4px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          textAlign: 'left',
        }}
      >
        <div style={{ width: '100%' }}>
          <div style={{ width: '100%', height: '150px', position: 'relative' }}>
            <Image
              src={photo.image_url || `${supabaseUrl}/storage/v1/object/public/photos/${photo.image_id}`}
              alt="photo"
              fill
              sizes="(max-width: 768px) 50px, 100px"
              quality={70}
              loading="lazy"
              style={{
                objectFit: 'cover',
              }}
            />
          </div>
          {photo.name && (
            <div style={{ padding: '0.5rem 0', fontSize: '0.85rem', color: '#666' }}>
              💌 {photo.name}
            </div>
          )}
        </div>
      </button>
    ))}
  </div>
)

export default function GalleryClient() {
  const [familyPhotos, setFamilyPhotos] = useState<GalleryPhoto[]>([])
  const [userPhotos, setUserPhotos] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'family' | 'shared'>('family')
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean
    images: string[]
    initialIndex: number
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setFamilyPhotos(FAMILY_PHOTOS)

      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .or('image_url.not.is.null,image_urls.not.is.null')
        .order('created_at', { ascending: false })

      setUserPhotos(postsData || [])
    } catch (err) {
      setError('Failed to load gallery')
    } finally {
      setLoading(false)
    }
  }

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    background: isActive ? '#333' : 'transparent',
    color: isActive ? 'white' : '#666',
    border: isActive ? 'none' : '1px solid #ddd',
    padding: '0.6rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.95rem',
  })

  return (
    <>
      <div className="container">
        <header>
          <h1>Photo Gallery</h1>
        </header>

        {error && <div className="error">{error}</div>}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => setActiveTab('family')}
            style={tabButtonStyle(activeTab === 'family')}
          >
            Family Photos
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            style={tabButtonStyle(activeTab === 'shared')}
          >
            Shared Memories
          </button>
        </div>
      </div>

      {loading ? (
        <DuckLoader withPadding />
      ) : (
        <>
          {activeTab === 'family' && (
            <>
              <MasonryGrid
                photos={familyPhotos}
                onImageClick={(imgs, idx) =>
                  setLightbox({ isOpen: true, images: imgs, initialIndex: idx })
                }
              />
              {familyPhotos.length === 0 && (
                <p style={{ color: '#aaa', textAlign: 'center', padding: '3rem 0' }}>No family photos yet.</p>
              )}
            </>
          )}

          {activeTab === 'shared' && (
            <>
              {userPhotos.length > 0 ? (
                <MasonryGrid
                  photos={userPhotos.flatMap((p) => {
                    const images = p.image_urls && p.image_urls.length > 0 ? p.image_urls : (p.image_url ? [p.image_url] : [])
                    return images.map((url, idx) => ({
                      id: `${p.id}-${idx}`,
                      image_url: url,
                      name: p.name,
                    }))
                  })}
                  onImageClick={(imgs, idx) =>
                    setLightbox({ isOpen: true, images: imgs, initialIndex: idx })
                  }
                />
              ) : (
                <p style={{ color: '#aaa', textAlign: 'center', padding: '3rem 0' }}>No shared memories yet.</p>
              )}
            </>
          )}
        </>
      )}

      <Lightbox
        isOpen={lightbox.isOpen}
        images={lightbox.images}
        initialIndex={lightbox.initialIndex}
        onClose={() => setLightbox({ isOpen: false, images: [], initialIndex: 0 })}
      />
    </>
  )
}
