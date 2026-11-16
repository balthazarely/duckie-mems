"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { ConfirmModal } from "@/app/components/ConfirmModal";
import { Lightbox } from "@/app/components/Lightbox";
import { DuckLoader } from "@/app/components/DuckLoader";
import { supabase } from "@/lib/supabase";

interface Post {
  id: string;
  created_at: string;
  name: string;
  caption: string | null;
  image_url: string | null;
  image_urls: string[] | null;
}

interface Comment {
  id: string;
  created_at: string;
  post_id: string;
  name: string;
  message: string;
}

export default function MessagesClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [commentForms, setCommentForms] = useState<{
    [postId: string]: { name: string; message: string };
  }>({});

  const [expandedCommentForm, setExpandedCommentForm] = useState<string | null>(
    null,
  );
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set(),
  );

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "post" | "comment" | null;
    id: string | null;
    onConfirm: (() => Promise<void>) | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    type: null,
    id: null,
    onConfirm: null,
    isDeleting: false,
  });

  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    images: string[];
    initialIndex: number;
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: commentsData } = await supabase
        .from("comments")
        .select("*")
        .order("created_at", { ascending: true });

      setPosts(postsData || []);
      setComments(commentsData || []);
    } catch (err) {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitComment(e: React.FormEvent, postId: string) {
    e.preventDefault();
    setError("");

    const form = commentForms[postId];
    if (!form?.name.trim() || !form?.message.trim()) {
      setError("Name and message are required");
      return;
    }

    try {
      const { data: newComment, error: insertError } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          name: form.name.trim(),
          message: form.message.trim(),
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      if (newComment?.id) {
        const myComments = JSON.parse(
          localStorage.getItem("myCommentIds") || "[]",
        );
        myComments.push(newComment.id);
        localStorage.setItem("myCommentIds", JSON.stringify(myComments));
      }

      setCommentForms({
        ...commentForms,
        [postId]: { name: "", message: "" },
      });

      await fetchData();
      toast.success("Comment added");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to add comment";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }

  function canDeletePost(postId: string): boolean {
    const myPosts = JSON.parse(localStorage.getItem("myPostIds") || "[]");
    return myPosts.includes(postId);
  }

  function canDeleteComment(commentId: string): boolean {
    const myComments = JSON.parse(localStorage.getItem("myCommentIds") || "[]");
    return myComments.includes(commentId);
  }

  async function handleDeleteComment(commentId: string) {
    if (!canDeleteComment(commentId)) {
      setError("You can only delete your own comments");
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: "comment",
      id: commentId,
      isDeleting: false,
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isDeleting: true }));
          setError("");

          const { error: err } = await supabase
            .from("comments")
            .delete()
            .eq("id", commentId);

          if (err) throw err;

          const myComments = JSON.parse(
            localStorage.getItem("myCommentIds") || "[]",
          );
          const updated = myComments.filter((id: string) => id !== commentId);
          localStorage.setItem("myCommentIds", JSON.stringify(updated));

          await fetchData();
          setConfirmModal({
            isOpen: false,
            type: null,
            id: null,
            onConfirm: null,
            isDeleting: false,
          });
          toast.success("Comment deleted");
        } catch (err) {
          setConfirmModal((prev) => ({ ...prev, isDeleting: false }));
          const errorMsg =
            err instanceof Error ? err.message : "Failed to delete comment";
          setError(errorMsg);
          toast.error(errorMsg);
        }
      },
    });
  }

  async function handleDeletePost(postId: string) {
    if (!canDeletePost(postId)) {
      setError("You can only delete your own posts");
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: "post",
      id: postId,
      isDeleting: false,
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isDeleting: true }));
          setError("");

          const post = posts.find((p) => p.id === postId);
          console.log("Post to delete:", post);
          if (post) {
            const imagesToDelete: string[] = [];

            // Collect all image paths to delete
            if (post.image_url) {
              const path = post.image_url.split("/storage/v1/object/public/photos/")[1];
              if (path) imagesToDelete.push(path);
            }

            if (post.image_urls && post.image_urls.length > 0) {
              post.image_urls.forEach((url) => {
                const path = url.split("/storage/v1/object/public/photos/")[1];
                if (path) imagesToDelete.push(path);
              });
            }

            // Delete all images from storage
            if (imagesToDelete.length > 0) {
              try {
                await supabase.storage.from("photos").remove(imagesToDelete).catch(() => {});
              } catch (err) {
                console.error("Error deleting images:", err);
              }
            }
          }

          const { error: err } = await supabase
            .from("posts")
            .delete()
            .eq("id", postId);

          if (err) throw err;

          const myPosts = JSON.parse(localStorage.getItem("myPostIds") || "[]");
          const updated = myPosts.filter((id: string) => id !== postId);
          localStorage.setItem("myPostIds", JSON.stringify(updated));

          await fetchData();
          setConfirmModal({
            isOpen: false,
            type: null,
            id: null,
            onConfirm: null,
            isDeleting: false,
          });
          toast.success("Post deleted");
        } catch (err) {
          setConfirmModal((prev) => ({ ...prev, isDeleting: false }));
          const errorMsg =
            err instanceof Error ? err.message : "Failed to delete post";
          setError(errorMsg);
          toast.error(errorMsg);
        }
      },
    });
  }

  const getPostComments = (postId: string) =>
    comments.filter((c) => c.post_id === postId);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="container">
      <header>
        <h1>Messages</h1>
        <p style={{ color: "#666", fontSize: "0.95rem", marginTop: "0.5rem" }}>
          Anni wanted her life to be celebrated with love, laughter, stories and
          of course, a whisky! <br />
          Please add your memories and/or photos of our precious Anni.
        </p>
        <Link
          href="/share"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
            marginTop: "1rem",
            background: "#333",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            textDecoration: "none",
          }}
        >
          <img
            src="/duck_image.png"
            alt="Duck"
            style={{
              height: "16px",
              width: "auto",
              filter: "brightness(0) invert(1)",
            }}
          />
          Share a Memory
        </Link>
      </header>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <DuckLoader withPadding />
      ) : posts.length === 0 ? (
        <div className="loading">No messages yet. Be the first to share.</div>
      ) : (
        <div className="posts">
          {posts.map((post) => {
            const images =
              post.image_urls && post.image_urls.length > 0
                ? post.image_urls
                : post.image_url
                  ? [post.image_url]
                  : [];

            return (
              <div key={post.id} className="post">
                <div className="post-content">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      marginBottom: "0.3rem",
                    }}
                  >
                    <div className="post-name">
                      <span style={{ marginRight: "0.3rem" }}>💌</span>
                      {post.name}
                    </div>
                    {canDeletePost(post.id) && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        style={{
                          background: "transparent",
                          color: "#999",
                          border: "1px solid #ddd",
                          padding: "0.3rem 0.6rem",
                          fontSize: "0.75rem",
                          borderRadius: "2px",
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  {post.caption && (
                    <div className="post-caption">{post.caption}</div>
                  )}
                  <div className="post-date">{formatDate(post.created_at)}</div>

                  {images.length > 0 && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(100px, 1fr))",
                        gap: "0.5rem",
                        padding: "0.5rem 0",
                        marginBottom: "1rem",
                      }}
                    >
                      {images.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() =>
                            setLightbox({
                              isOpen: true,
                              images,
                              initialIndex: idx,
                            })
                          }
                          style={{
                            width: "100%",
                            aspectRatio: "1",
                            padding: 0,
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            overflow: "hidden",
                            cursor: "pointer",
                            background: "transparent",
                          }}
                        >
                          <Image
                            src={url}
                            alt={`Photo shared by ${post.name}`}
                            width={200}
                            height={200}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="comments">
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedComments((prev) => {
                          const next = new Set(prev);
                          if (next.has(post.id)) {
                            next.delete(post.id);
                          } else {
                            next.add(post.id);
                          }
                          return next;
                        });
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#666",
                        cursor: "pointer",
                        padding: "0.2rem 0",
                        fontSize: "0.85rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {expandedComments.has(post.id) ? "▼" : "▶"} Comments{" "}
                      {getPostComments(post.id).length > 0 &&
                        `(${getPostComments(post.id).length})`}
                    </button>

                    {expandedComments.has(post.id) && (
                      <>
                        {getPostComments(post.id).length > 0 ? (
                          getPostComments(post.id).map((comment) => (
                            <div key={comment.id} className="comment">
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "start",
                                  marginBottom: "0.2rem",
                                }}
                              >
                                <div className="comment-name">
                                  {comment.name}
                                </div>
                                {canDeleteComment(comment.id) && (
                                  <button
                                    onClick={() =>
                                      handleDeleteComment(comment.id)
                                    }
                                    style={{
                                      background: "transparent",
                                      color: "#999",
                                      border: "1px solid #ddd",
                                      padding: "0.2rem 0.4rem",
                                      fontSize: "0.7rem",
                                      borderRadius: "2px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                              <div className="comment-message">
                                {comment.message}
                              </div>
                              <div className="comment-date">
                                {formatDate(comment.created_at)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ color: "#aaa", fontSize: "0.9rem" }}>
                            No comments yet
                          </div>
                        )}
                      </>
                    )}

                    {expandedComments.has(post.id) &&
                    expandedCommentForm === post.id ? (
                      <form
                        className="comment-form"
                        onSubmit={(e) => {
                          handleSubmitComment(e, post.id);
                          setExpandedCommentForm(null);
                        }}
                      >
                        <div className="form-group">
                          <label htmlFor={`comment-name-${post.id}`}>
                            Name
                          </label>
                          <input
                            id={`comment-name-${post.id}`}
                            type="text"
                            maxLength={80}
                            value={commentForms[post.id]?.name || ""}
                            onChange={(e) =>
                              setCommentForms({
                                ...commentForms,
                                [post.id]: {
                                  ...commentForms[post.id],
                                  name: e.target.value,
                                },
                              })
                            }
                            placeholder="Your name"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor={`comment-message-${post.id}`}>
                            Comment
                          </label>
                          <textarea
                            id={`comment-message-${post.id}`}
                            maxLength={1000}
                            value={commentForms[post.id]?.message || ""}
                            onChange={(e) =>
                              setCommentForms({
                                ...commentForms,
                                [post.id]: {
                                  ...commentForms[post.id],
                                  message: e.target.value,
                                },
                              })
                            }
                            placeholder="Share a memory..."
                            required
                            autoFocus
                          />
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button type="submit">Add Comment</button>
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedCommentForm(null);
                              setCommentForms({
                                ...commentForms,
                                [post.id]: { name: "", message: "" },
                              });
                            }}
                            style={{ background: "#999" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      expandedComments.has(post.id) && (
                        <button
                          onClick={() => setExpandedCommentForm(post.id)}
                          style={{
                            background: "transparent",
                            color: "#666",
                            border: "1px solid #ddd",
                            padding: "0.6rem 1rem",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            width: "100%",
                            marginTop: "0.5rem",
                          }}
                        >
                          Add a comment
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        isLoading={confirmModal.isDeleting}
        title={
          confirmModal.type === "post" ? "Delete Post?" : "Delete Comment?"
        }
        message={
          confirmModal.type === "post"
            ? "This will delete the post and all its comments."
            : "Are you sure you want to delete this comment?"
        }
        onConfirm={() => {
          if (confirmModal.onConfirm) {
            confirmModal.onConfirm();
          }
        }}
        onCancel={() =>
          !confirmModal.isDeleting &&
          setConfirmModal({
            isOpen: false,
            type: null,
            id: null,
            onConfirm: null,
            isDeleting: false,
          })
        }
        confirmText="Delete"
      />

      <Lightbox
        isOpen={lightbox.isOpen}
        images={lightbox.images}
        initialIndex={lightbox.initialIndex}
        onClose={() =>
          setLightbox({ isOpen: false, images: [], initialIndex: 0 })
        }
      />
    </div>
  );
}
