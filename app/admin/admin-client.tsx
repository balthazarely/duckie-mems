'use client'

import { useState, useEffect } from 'react'
import NextImage from 'next/image'
import toast from 'react-hot-toast'
import { ConfirmModal } from '@/app/components/ConfirmModal'
import { DuckLoader } from '@/app/components/DuckLoader'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

interface Post {
  id: string
  created_at: string
  name: string
  caption: string | null
  image_url: string | null
  image_urls: string[] | null
}

interface Comment {
  id: string
  created_at: string
  post_id: string
  name: string
  message: string
}

export default function AdminClient() {
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  const [editingPost, setEditingPost] = useState<string | null>(null)
  const [editingPostData, setEditingPostData] = useState<Partial<Post>>({})
  const [editingPostFile, setEditingPostFile] = useState<File | null>(null)

  const [galleryPhotos, setGalleryPhotos] = useState<Array<{ id: string; image_id: string }>>([])
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [uploadingGallery, setUploadingGallery] = useState(false)

  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editingCommentData, setEditingCommentData] = useState<Partial<Comment>>({})

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean
    type: 'post' | 'comment' | 'gallery' | null
    id: string | null
    isDeleting: boolean
  }>({
    isOpen: false,
    type: null,
    id: null,
    isDeleting: false,
  })

  useEffect(() => {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true'
    if (!adminLoggedIn) {
      router.push('/')
      return
    }
    setIsAdmin(true)
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
    setConfirmDelete({
      isOpen: true,
      type: 'post',
      id: postId,
      isDeleting: false,
    })
  }

  async function confirmDeletePost() {
    if (!confirmDelete.id) return

    try {
      setConfirmDelete((prev) => ({ ...prev, isDeleting: true }))
      setError('')
      setSuccess('')

      const post = posts.find((p) => p.id === confirmDelete.id)
      if (post) {
        const imagesToDelete: string[] = []

        // Collect all image paths to delete
        if (post.image_url) {
          const path = post.image_url.split('/storage/v1/object/public/photos/')[1]
          if (path) imagesToDelete.push(path)
        }

        if (post.image_urls && post.image_urls.length > 0) {
          post.image_urls.forEach((url) => {
            const path = url.split('/storage/v1/object/public/photos/')[1]
            if (path) imagesToDelete.push(path)
          })
        }

        // Delete all images from storage
        if (imagesToDelete.length > 0) {
          try {
            await supabase.storage
              .from('photos')
              .remove(imagesToDelete)
              .catch(() => {})
          } catch (err) {
            console.error('Error deleting images:', err)
          }
        }
      }

      const { error: err } = await supabase
        .from('posts')
        .delete()
        .eq('id', confirmDelete.id)

      if (err) throw err

      toast.success('Post deleted')
      setConfirmDelete({ isOpen: false, type: null, id: null, isDeleting: false })
      await fetchData()
    } catch (err) {
      setConfirmDelete((prev) => ({ ...prev, isDeleting: false }))
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete post'
      toast.error(errorMsg)
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
      let imageUrls = editingPostData.image_urls

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

        const newImageUrl = `${supabaseUrl}/storage/v1/object/public/photos/${uploadData.path}`

        if (imageUrls && imageUrls.length > 0) {
          imageUrls = [newImageUrl, ...imageUrls]
        } else {
          imageUrl = newImageUrl
          imageUrls = null
        }
      }

      const { error: err } = await supabase
        .from('posts')
        .update({
          name: editingPostData.name,
          caption: editingPostData.caption,
          image_url: imageUrl,
          image_urls: imageUrls,
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
    setConfirmDelete({
      isOpen: true,
      type: 'comment',
      id: commentId,
      isDeleting: false,
    })
  }

  async function confirmDeleteComment() {
    if (!confirmDelete.id) return

    try {
      setConfirmDelete((prev) => ({ ...prev, isDeleting: true }))
      setError('')
      setSuccess('')

      const { error: err } = await supabase
        .from('comments')
        .delete()
        .eq('id', confirmDelete.id)

      if (err) throw err

      toast.success('Comment deleted')
      setConfirmDelete({ isOpen: false, type: null, id: null, isDeleting: false })
      await fetchData()
    } catch (err) {
      setConfirmDelete((prev) => ({ ...prev, isDeleting: false }))
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete comment'
      toast.error(errorMsg)
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

      const imageIds: string[] = []

      for (const file of galleryFiles) {
        const fileName = `gallery-${Date.now()}-${Math.random().toString(36).substring(7)}`
        const fileExt = file.type.split('/')[1] || 'jpg'

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(`public/gallery/${fileName}.${fileExt}`, file, {
            contentType: file.type,
          })

        if (uploadError) throw uploadError

        imageIds.push(uploadData.path)
      }

      const { error: insertError } = await supabase.from('gallery_photos').insert(
        imageIds.map((imageId) => ({
          image_id: imageId,
        }))
      )

      if (insertError) throw insertError

      setGalleryFiles([])
      setSuccess(`${imageIds.length} photo${imageIds.length !== 1 ? 's' : ''} added to gallery`)
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photos')
    } finally {
      setUploadingGallery(false)
    }
  }

  async function deleteGalleryPhoto(photoId: string) {
    setConfirmDelete({
      isOpen: true,
      type: 'gallery',
      id: photoId,
      isDeleting: false,
    })
  }

  async function confirmDeleteGalleryPhoto() {
    if (!confirmDelete.id) return

    try {
      setConfirmDelete((prev) => ({ ...prev, isDeleting: true }))
      setError('')
      setSuccess('')

      const photo = galleryPhotos.find((p) => p.id === confirmDelete.id)
      if (photo?.image_id) {
        try {
          await supabase.storage
            .from('photos')
            .remove([photo.image_id])
        } catch (err) {
          console.error('Error deleting image:', err)
        }
      }

      const { error: err } = await supabase
        .from('gallery_photos')
        .delete()
        .eq('id', confirmDelete.id)

      if (err) throw err

      toast.success('Photo deleted')
      setConfirmDelete({ isOpen: false, type: null, id: null, isDeleting: false })
      await fetchData()
    } catch (err) {
      setConfirmDelete((prev) => ({ ...prev, isDeleting: false }))
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete photo'
      toast.error(errorMsg)
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

  if (!isAdmin) {
    return (
      <div className="container">
        <header>
          <h1>Admin Panel</h1>
        </header>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container">
        <header>
          <h1>Admin Panel</h1>
        </header>
        <DuckLoader withPadding />
      </div>
    )
  }

  return (
    <div className="container">
      <header>
        <h1>Admin Panel</h1>
        <button
          onClick={() => {
            localStorage.removeItem('adminLoggedIn')
            router.push('/')
          }}
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

                        {(() => {
                          const images = editingPostData.image_urls && editingPostData.image_urls.length > 0
                            ? editingPostData.image_urls
                            : editingPostData.image_url ? [editingPostData.image_url] : []
                          return images.length > 0 ? (
                            <div style={{ marginBottom: '0.5rem' }}>
                              <div style={{ fontSize: '0.9rem', marginBottom: '0.3rem' }}>Current photos:</div>
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                                  gap: '0.4rem',
                                  marginBottom: '0.5rem',
                                }}
                              >
                                {images.map((url: string, idx: number) => (
                                  <div
                                    key={idx}
                                    style={{
                                      position: 'relative',
                                      aspectRatio: '1',
                                      borderRadius: '4px',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    <img
                                      src={url}
                                      alt={`Photo ${idx + 1}`}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedImages = images.filter((_, i) => i !== idx)
                                        if (updatedImages.length === 0) {
                                          setEditingPostData({
                                            ...editingPostData,
                                            image_url: null,
                                            image_urls: null,
                                          })
                                        } else {
                                          setEditingPostData({
                                            ...editingPostData,
                                            image_url: updatedImages[0],
                                            image_urls: updatedImages.length > 1 ? updatedImages : null,
                                          })
                                        }
                                      }}
                                      style={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        background: '#c33',
                                        color: 'white',
                                        border: 'none',
                                        width: '20px',
                                        height: '20px',
                                        padding: 0,
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null
                        })()}

                        <div style={{ marginBottom: '0.5rem' }}>
                          <label htmlFor={`edit-photo-${post.id}`} style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                            Add/Replace photo (optional)
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
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                            gap: '0.5rem',
                            marginBottom: '0.5rem',
                          }}
                        >
                          {(() => {
                            const images = post.image_urls && post.image_urls.length > 0
                              ? post.image_urls
                              : post.image_url ? [post.image_url] : []
                            return images.map((url: string, idx: number) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`${post.name} ${idx + 1}`}
                                style={{
                                  width: '100%',
                                  height: '100px',
                                  objectFit: 'cover',
                                  borderRadius: '4px',
                                }}
                              />
                            ))
                          })()}
                        </div>
                        {(() => {
                          const postComments = comments.filter((c) => c.post_id === post.id)
                          return (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
                              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                                Comments ({postComments.length})
                              </div>
                              {postComments.length === 0 ? (
                                <div style={{ color: '#aaa', fontSize: '0.85rem' }}>No comments yet</div>
                              ) : (
                                postComments.map((comment) => (
                                  <div
                                    key={comment.id}
                                    style={{
                                      marginBottom: '0.75rem',
                                      padding: '0.5rem',
                                      background: '#f5f5f5',
                                      borderRadius: '3px',
                                      fontSize: '0.85rem',
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
                                          style={{ width: '100%', marginBottom: '0.3rem', fontSize: '0.85rem' }}
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
                                          style={{ width: '100%', marginBottom: '0.3rem', fontSize: '0.85rem' }}
                                        />
                                        <button
                                          onClick={() => saveCommentEdit(comment.id)}
                                          style={{ marginRight: '0.3rem', fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() => setEditingComment(null)}
                                          style={{ background: '#999', fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <div style={{ marginBottom: '0.2rem' }}>
                                          <strong>{comment.name}</strong>{' '}
                                          <span style={{ color: '#999', fontSize: '0.75rem' }}>
                                            {formatDate(comment.created_at)}
                                          </span>
                                        </div>
                                        <div style={{ marginBottom: '0.3rem', color: '#555' }}>
                                          {comment.message}
                                        </div>
                                        <div style={{ marginTop: '0.3rem' }}>
                                          <button
                                            onClick={() => {
                                              setEditingComment(comment.id)
                                              setEditingCommentData(comment)
                                            }}
                                            style={{ marginRight: '0.3rem', fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => deleteComment(comment.id)}
                                            style={{ background: '#c33', fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}
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
                          )
                        })()}
                        <div style={{ marginTop: '0.5rem' }}>
                          <button
                            onClick={() => {
                              setEditingPost(post.id)
                              setEditingPostData(post)
                            }}
                            style={{ marginRight: '0.5rem' }}
                          >
                            Edit Post
                          </button>
                          <button
                            onClick={() => deletePost(post.id)}
                            style={{ background: '#c33' }}
                          >
                            Delete Post
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
                    <NextImage
                      src={`${supabaseUrl}/storage/v1/object/public/photos/${photo.image_id}`}
                      alt="gallery photo"
                      width={150}
                      height={150}
                      quality={50}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: '4px',
                      }}
                    />
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

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        isLoading={confirmDelete.isDeleting}
        title={
          confirmDelete.type === 'post'
            ? 'Delete Post?'
            : confirmDelete.type === 'comment'
              ? 'Delete Comment?'
              : 'Delete Photo?'
        }
        message={
          confirmDelete.type === 'post'
            ? 'This will delete the post and all its comments.'
            : 'Are you sure you want to delete this?'
        }
        onConfirm={() => {
          if (confirmDelete.type === 'post') {
            confirmDeletePost()
          } else if (confirmDelete.type === 'comment') {
            confirmDeleteComment()
          } else {
            confirmDeleteGalleryPhoto()
          }
        }}
        onCancel={() =>
          !confirmDelete.isDeleting &&
          setConfirmDelete({ isOpen: false, type: null, id: null, isDeleting: false })
        }
      />
    </div>
  )
}
