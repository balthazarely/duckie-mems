'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Lightbox } from '@/app/components/Lightbox'
import { DuckLoader } from '@/app/components/DuckLoader'
import { supabase } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

const FAMILY_PHOTOS = [
  { id: '1', image_url: '/family gallery/IMG_0068.jpeg', name: '' },
  { id: '2', image_url: '/family gallery/IMG_2015.jpeg', name: '' },
  { id: '3', image_url: '/family gallery/IMG_4308.jpeg', name: '' },
  { id: '4', image_url: '/family gallery/IMG_4547.jpeg', name: '' },
  { id: '5', image_url: '/family gallery/IMG_4605.jpeg', name: '' },
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
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
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
        <div style={{ width: '100%', height: '150px', position: 'relative' }}>
          <Image
            src={photo.image_url || `${supabaseUrl}/storage/v1/object/public/photos/${photo.image_id}`}
            alt="photo"
            fill
            sizes="(max-width: 768px) 50px, 100px"
            quality={50}
            loading="lazy"
            style={{
              objectFit: 'cover',
            }}
          />
        </div>
      </button>
    ))}
  </div>
)

export default function Gallery() {
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
                <p style={{ color: '#aaa' }}>No family photos yet.</p>
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
                      name: `💌 ${p.name}`,
                    }))
                  })}
                  onImageClick={(imgs, idx) =>
                    setLightbox({ isOpen: true, images: imgs, initialIndex: idx })
                  }
                />
              ) : (
                <p style={{ color: '#aaa' }}>No shared memories yet.</p>
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
