import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Post {
  id: string
  created_at: string
  name: string
  caption: string | null
  image_url: string
}

interface Comment {
  id: string
  created_at: string
  post_id: string
  name: string
  message: string
}

export function Admin({
  onLogout,
}: {
  onLogout: () => void
}) {
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [editingPost, setEditingPost] = useState<string | null>(null)
  const [editingPostData, setEditingPostData] = useState<Partial<Post>>({})
  const [editingPostFile, setEditingPostFile] = useState<File | null>(null)

  const [galleryPhotos, setGalleryPhotos] = useState<Array<{ id: string; image_url: string; caption: string | null }>>([])
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [uploadingGallery, setUploadingGallery] = useState(false)

  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editingCommentData, setEditingCommentData] = useState<Partial<Comment>>({})

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: true })

      const { data: galleryData } = await supabase
        .from('gallery_photos')
        .select('*')
        .order('created_at', { ascending: false })

      setPosts(postsData || [])
      setComments(commentsData || [])
      setGalleryPhotos(galleryData || [])
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function deletePost(postId: string) {
    if (!confirm('Delete this post? Comments will also be deleted.')) return

    try {
      setError('')
      setSuccess('')

      const { error: err } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (err) throw err

      setSuccess('Post deleted')
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post')
    }
  }

  async function resizeImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > 1600) {
            height = (height * 1600) / width
            width = 1600
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Could not resize image'))
          }, 'image/jpeg', 0.85)
        }
        img.onerror = () => reject(new Error('Could not load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Could not read file'))
      reader.readAsDataURL(file)
    })
  }

  async function savePostEdit(postId: string) {
    try {
      setError('')
      setSuccess('')

      let imageUrl = editingPostData.image_url

      if (editingPostFile) {
        const resizedBlob = await resizeImage(editingPostFile)
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`
        const fileExt = editingPostFile.type.split('/')[1] || 'jpg'

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(`public/${fileName}.${fileExt}`, resizedBlob, {
            contentType: editingPostFile.type,
          })

        if (uploadError) throw uploadError

        imageUrl = `${supabaseUrl}/storage/v1/object/public/photos/${uploadData.path}`
      }

      const { error: err } = await supabase
        .from('posts')
        .update({
          name: editingPostData.name,
          caption: editingPostData.caption,
          image_url: imageUrl,
        })
        .eq('id', postId)

      if (err) throw err

      setEditingPost(null)
      setEditingPostFile(null)
      setSuccess('Post updated')
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post')
    }
  }

  async function deleteComment(commentId: string) {
    if (!confirm('Delete this comment?')) return

    try {
      setError('')
      setSuccess('')

      const { error: err } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (err) throw err

      setSuccess('Comment deleted')
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment')
    }
  }

  async function handleUploadGalleryPhoto(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (galleryFiles.length === 0) {
      setError('Please select photos')
      return
    }

    try {
      setUploadingGallery(true)

      const imageUrls: string[] = []

      for (const file of galleryFiles) {
        const fileName = `gallery-${Date.now()}-${Math.random().toString(36).substring(7)}`
        const fileExt = file.type.split('/')[1] || 'jpg'

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(`public/gallery/${fileName}.${fileExt}`, file, {
            contentType: file.type,
          })

        if (uploadError) throw uploadError

        imageUrls.push(
          `${supabaseUrl}/storage/v1/object/public/photos/${uploadData.path}`
        )
      }

      const { error: insertError } = await supabase.from('gallery_photos').insert(
        imageUrls.map((url) => ({
          image_url: url,
          caption: null,
        }))
      )

      if (insertError) throw insertError

      setGalleryFiles([])
      setSuccess(`${imageUrls.length} photo${imageUrls.length !== 1 ? 's' : ''} added to gallery`)
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photos')
    } finally {
      setUploadingGallery(false)
    }
  }

  async function deleteGalleryPhoto(photoId: string) {
    if (!confirm('Delete this photo?')) return

    try {
      setError('')
      setSuccess('')

      const photo = galleryPhotos.find((p) => p.id === photoId)
      if (photo?.image_url) {
        const path = photo.image_url.split('/storage/v1/object/public/photos/')[1]
        if (path) {
          await supabase.storage
            .from('photos')
            .remove([path])
            .catch(() => {})
        }
      }

      const { error: err } = await supabase
        .from('gallery_photos')
        .delete()
        .eq('id', photoId)

      if (err) throw err

      setSuccess('Photo deleted')
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo')
    }
  }

  async function saveCommentEdit(commentId: string) {
    try {
      setError('')
      setSuccess('')

      const { error: err } = await supabase
        .from('comments')
        .update({
          name: editingCommentData.name,
          message: editingCommentData.message,
        })
        .eq('id', commentId)

      if (err) throw err

      setEditingComment(null)
      setSuccess('Comment updated')
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment')
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="container">
      <header>
        <h1>Admin Panel</h1>
        <button
          onClick={onLogout}
          style={{
            marginTop: '1rem',
            background: '#666',
          }}
        >
          Logout
        </button>
      </header>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="form-section">
            <h2>Posts ({posts.length})</h2>
            <div style={{ marginTop: '1rem' }}>
              {posts.length === 0 ? (
                <p>No posts</p>
              ) : (
                posts.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      marginBottom: '1.5rem',
                      padding: '1rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  >
                    {editingPost === post.id ? (
                      <>
                        <input
                          type="text"
                          maxLength={80}
                          value={editingPostData.name}
                          onChange={(e) =>
                            setEditingPostData({
                              ...editingPostData,
                              name: e.target.value,
                            })
                          }
                          style={{ width: '100%', marginBottom: '0.5rem' }}
                        />
                        <textarea
                          maxLength={500}
                          value={editingPostData.caption || ''}
                          onChange={(e) =>
                            setEditingPostData({
                              ...editingPostData,
                              caption: e.target.value,
                            })
                          }
                          style={{ width: '100%', marginBottom: '0.5rem' }}
                        />
                        <div style={{ marginBottom: '0.5rem' }}>
                          <label htmlFor={`edit-photo-${post.id}`} style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                            Replace photo (optional)
                          </label>
                          <input
                            id={`edit-photo-${post.id}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => setEditingPostFile(e.target.files?.[0] || null)}
                            style={{ fontSize: '0.9rem' }}
                          />
                        </div>
                        <button
                          onClick={() => savePostEdit(post.id)}
                          style={{ marginRight: '0.5rem' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingPost(null)
                            setEditingPostFile(null)
                          }}
                          style={{ background: '#999' }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong>{post.name}</strong>{' '}
                          <span style={{ color: '#999', fontSize: '0.85rem' }}>
                            {formatDate(post.created_at)}
                          </span>
                        </div>
                        {post.caption && (
                          <div
                            style={{
                              marginBottom: '0.5rem',
                              color: '#555',
                              fontSize: '0.9rem',
                            }}
                          >
                            {post.caption}
                          </div>
                        )}
                        <img
                          src={post.image_url}
                          alt={post.name}
                          style={{
                            maxWidth: '200px',
                            marginBottom: '0.5rem',
                            borderRadius: '4px',
                          }}
                        />
                        <div>
                          <button
                            onClick={() => {
                              setEditingPost(post.id)
                              setEditingPostData(post)
                            }}
                            style={{ marginRight: '0.5rem' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deletePost(post.id)}
                            style={{ background: '#c33' }}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="form-section">
            <h2>Comments ({comments.length})</h2>
            <div style={{ marginTop: '1rem' }}>
              {comments.length === 0 ? (
                <p>No comments</p>
              ) : (
                comments.map((comment) => {
                  const post = posts.find((p) => p.id === comment.post_id)
                  return (
                    <div
                      key={comment.id}
                      style={{
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        background: '#f9f9f9',
                      }}
                    >
                      {editingComment === comment.id ? (
                        <>
                          <input
                            type="text"
                            maxLength={80}
                            value={editingCommentData.name}
                            onChange={(e) =>
                              setEditingCommentData({
                                ...editingCommentData,
                                name: e.target.value,
                              })
                            }
                            style={{ width: '100%', marginBottom: '0.5rem' }}
                          />
                          <textarea
                            maxLength={1000}
                            value={editingCommentData.message}
                            onChange={(e) =>
                              setEditingCommentData({
                                ...editingCommentData,
                                message: e.target.value,
                              })
                            }
                            style={{ width: '100%', marginBottom: '0.5rem' }}
                          />
                          <button
                            onClick={() => saveCommentEdit(comment.id)}
                            style={{ marginRight: '0.5rem' }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingComment(null)}
                            style={{ background: '#999' }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <div style={{ marginBottom: '0.3rem' }}>
                            <strong>{comment.name}</strong>{' '}
                            <span style={{ color: '#999', fontSize: '0.8rem' }}>
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <div
                            style={{
                              marginBottom: '0.5rem',
                              fontSize: '0.9rem',
                              color: '#555',
                            }}
                          >
                            {comment.message}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#999' }}>
                            on "{post?.name || 'deleted post'}"
                          </div>
                          <div style={{ marginTop: '0.5rem' }}>
                            <button
                              onClick={() => {
                                setEditingComment(comment.id)
                                setEditingCommentData(comment)
                              }}
                              style={{ marginRight: '0.5rem' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteComment(comment.id)}
                              style={{ background: '#c33' }}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="form-section">
            <h2>Gallery Photos</h2>
            <form onSubmit={handleUploadGalleryPhoto} style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label htmlFor="gallery-photos">Upload Photos (multiple)</label>
                <input
                  id="gallery-photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    setGalleryFiles((prev) => {
                      const combined = [...prev, ...files]
                      return combined.slice(0, 20)
                    })
                  }}
                />
                {galleryFiles.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                      {galleryFiles.length} photo{galleryFiles.length !== 1 ? 's' : ''} selected
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                        gap: '0.5rem',
                      }}
                    >
                      {galleryFiles.map((file, idx) => (
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
                              setGalleryFiles(galleryFiles.filter((_, i) => i !== idx))
                            }
                            type="button"
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={uploadingGallery || galleryFiles.length === 0}>
                {uploadingGallery ? 'Uploading...' : 'Add to Gallery'}
              </button>
            </form>

            {galleryPhotos.length === 0 ? (
              <p>No gallery photos yet</p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '1rem',
                }}
              >
                {galleryPhotos.map((photo) => (
                  <div key={photo.id} style={{ position: 'relative' }}>
                    <img
                      src={photo.image_url}
                      alt={photo.caption || 'gallery photo'}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                      }}
                    />
                    {photo.caption && (
                      <div style={{ fontSize: '0.8rem', marginTop: '0.3rem', color: '#555' }}>
                        {photo.caption}
                      </div>
                    )}
                    <button
                      onClick={() => deleteGalleryPhoto(photo.id)}
                      style={{
                        position: 'absolute',
                        top: '0.3rem',
                        right: '0.3rem',
                        background: '#c33',
                        color: 'white',
                        border: 'none',
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.75rem',
                        borderRadius: '2px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
