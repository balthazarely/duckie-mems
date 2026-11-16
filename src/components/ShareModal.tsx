import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import imageCompression from 'browser-image-compression'
import toast from 'react-hot-toast'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function ShareModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [formName, setFormName] = useState('')
  const [formCaption, setFormCaption] = useState('')
  const [formFiles, setFormFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function resizeImage(file: File): Promise<Blob> {
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      })
      return compressed
    } catch (error) {
      throw new Error('Could not compress image')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!formName.trim()) {
      setError('Name is required')
      return
    }

    if (!formCaption.trim() && formFiles.length === 0) {
      setError('Please share a memory or add photos')
      return
    }

    try {
      setLoading(true)

      const imageUrls: string[] = []

      for (const file of formFiles) {
        const resizedBlob = await resizeImage(file)
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`
        const fileExt = file.type.split('/')[1] || 'jpg'

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(`public/${fileName}.${fileExt}`, resizedBlob, {
            contentType: file.type,
          })

        if (uploadError) throw uploadError

        imageUrls.push(
          `${supabaseUrl}/storage/v1/object/public/photos/${uploadData.path}`
        )
      }

      const { data: newPost, error: insertError } = await supabase
        .from('posts')
        .insert({
          name: formName.trim(),
          caption: formCaption.trim() || null,
          image_url: imageUrls.length > 0 ? imageUrls[0] : null,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
        })
        .select('id')
        .single()

      console.log('Post created:', newPost, 'Error:', insertError)

      if (insertError) throw insertError

      if (newPost?.id) {
        const myPosts = JSON.parse(localStorage.getItem('myPostIds') || '[]')
        myPosts.push(newPost.id)
        localStorage.setItem('myPostIds', JSON.stringify(myPosts))
      }

      toast.success('Memory shared!')
      setFormName('')
      setFormCaption('')
      setFormFiles([])
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error posting:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to share memory'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '1rem' }}>Share a Memory</h2>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              type="text"
              maxLength={80}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="memory">Memory or Message</label>
            <textarea
              id="memory"
              maxLength={500}
              value={formCaption}
              onChange={(e) => setFormCaption(e.target.value)}
              placeholder="Share a thought, story, or memory..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="photos">Photos (optional, max 5)</label>
            <input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const newFiles = Array.from(e.target.files || [])
                setFormFiles((prev) => {
                  const combined = [...prev, ...newFiles]
                  return combined.slice(0, 5)
                })
              }}
            />
            {formFiles.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                  {formFiles.length} photo{formFiles.length !== 1 ? 's' : ''} selected
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                    gap: '0.5rem',
                  }}
                >
                  {formFiles.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        aspectRatio: '1',
                        background: '#f0f0f0',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        border: '1px solid #ddd',
                      }}
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${idx + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <button
                        onClick={() =>
                          setFormFiles(formFiles.filter((_, i) => i !== idx))
                        }
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          background: '#c33',
                          color: 'white',
                          border: 'none',
                          width: '24px',
                          height: '24px',
                          padding: 0,
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title={file.name}
                      >
                        ✕
                      </button>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          fontSize: '0.7rem',
                          padding: '0.2rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={file.name}
                      >
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" disabled={loading}>
              {loading ? 'Sharing...' : 'Share'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ background: '#999' }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
