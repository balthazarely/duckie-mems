'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { ConfirmModal } from '@/app/components/ConfirmModal'
import { DuckLoader } from '@/app/components/DuckLoader'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  const [editingPost, setEditingPost] = useState<string | null>(null)
  const [editingPostData, setEditingPostData] = useState<Partial<Post>>({})


  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editingCommentData, setEditingCommentData] = useState<Partial<Comment>>({})

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean
    type: 'post' | 'comment' | null
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

      setPosts(postsData || [])
      setComments(commentsData || [])
    } catch (err) {
      toast.error('Failed to load data')
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

      // Delete all comments associated with this post
      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .eq('post_id', confirmDelete.id)

      if (commentsError) console.error('Error deleting comments:', commentsError)

      // Delete the post
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

async function savePostEdit(postId: string) {
    try {

      const originalPost = posts.find((p) => p.id === postId)
      if (!originalPost) throw new Error('Post not found')

      // Collect image URLs that are being removed
      const originalImages: string[] = []
      if (originalPost.image_url) originalImages.push(originalPost.image_url)
      if (originalPost.image_urls) originalImages.push(...originalPost.image_urls)

      const newImages: string[] = []
      if (editingPostData.image_url) newImages.push(editingPostData.image_url)
      if (editingPostData.image_urls) newImages.push(...editingPostData.image_urls)

      const imagesToDelete = originalImages.filter((url) => !newImages.includes(url))

      // Delete removed images from storage
      if (imagesToDelete.length > 0) {
        const pathsToDelete = imagesToDelete
          .map((url) => url.split('/storage/v1/object/public/photos/')[1])
          .filter(Boolean)

        if (pathsToDelete.length > 0) {
          try {
            await supabase.storage
              .from('photos')
              .remove(pathsToDelete)
          } catch (err) {
            console.error('Error deleting images:', err)
          }
        }
      }

      const updateData: any = {
        name: editingPostData.name,
        caption: editingPostData.caption,
      }

      if (editingPostData.image_urls && editingPostData.image_urls.length > 0) {
        updateData.image_url = null
        updateData.image_urls = editingPostData.image_urls
      } else if (editingPostData.image_url) {
        updateData.image_url = editingPostData.image_url
        updateData.image_urls = null
      } else {
        updateData.image_url = null
        updateData.image_urls = null
      }

      const { error: err } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId)

      if (err) throw err

      setEditingPost(null)
      toast.success('Post updated')
      await fetchData()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update post'
      toast.error(errorMsg)
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

async function saveCommentEdit(commentId: string) {
    try {
      const { error: err } = await supabase
        .from('comments')
        .update({
          name: editingCommentData.name,
          message: editingCommentData.message,
        })
        .eq('id', commentId)

      if (err) throw err

      setEditingComment(null)
      toast.success('Comment updated')
      await fetchData()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update comment'
      toast.error(errorMsg)
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
                                    <Image
                                      src={url}
                                      alt={`Photo ${idx + 1}`}
                                      fill
                                      sizes="80px"
                                      quality={50}
                                      style={{
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

<button
                          onClick={() => savePostEdit(post.id)}
                          style={{ marginRight: '0.5rem' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingPost(null)
                          }}
                          style={{ background: '#999' }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <div>
                            <strong>{post.name}</strong>{' '}
                            <span style={{ color: '#999', fontSize: '0.85rem' }}>
                              {formatDate(post.created_at)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => {
                                setEditingPost(post.id)
                                setEditingPostData(post)
                              }}
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.4rem 0.6rem',
                                background: '#333',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deletePost(post.id)}
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.4rem 0.6rem',
                                background: '#c33',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                              }}
                            >
                              Delete
                            </button>
                          </div>
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
                              <div
                                key={idx}
                                style={{
                                  position: 'relative',
                                  width: '100%',
                                  height: '100px',
                                  borderRadius: '4px',
                                  overflow: 'hidden',
                                }}
                              >
                                <Image
                                  src={url}
                                  alt={`${post.name} ${idx + 1}`}
                                  fill
                                  sizes="100px"
                                  quality={50}
                                  style={{
                                    objectFit: 'cover',
                                  }}
                                />
                              </div>
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
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
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
