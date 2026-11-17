"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { DuckLoader } from "@/app/components/DuckLoader";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function SharePage() {
  const [formName, setFormName] = useState("");
  const [formCaption, setFormCaption] = useState("");
  const [formFiles, setFormFiles] = useState<File[]>([]);
  const [formWebsite, setFormWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const isFormValid = () => {
    if (!formName.trim() || !/[a-zA-Z]/.test(formName)) return false;
    if (!formCaption.trim() && formFiles.length === 0) return false;
    return true;
  };

  async function resizeImage(file: File): Promise<Blob> {
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      });
      return compressed;
    } catch (error) {
      throw new Error("Could not compress image");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (formWebsite.trim()) {
      toast.success("Memory shared!");
      router.push("/messages");
      return;
    }

    if (!formName.trim()) {
      const msg = "Name is required";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!/[a-zA-Z]/.test(formName)) {
      const msg = "Name must contain at least one letter";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!formCaption.trim() && formFiles.length === 0) {
      const msg = "Please share a memory or add photos";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (formCaption.trim()) {
      const trimmedCaption = formCaption.trim();

      const letterCount = (trimmedCaption.match(/[a-zA-Z]/g) || []).length;
      const textLength = trimmedCaption.length;
      if (letterCount < textLength * 0.3) {
        setError("Please enter a real message (not just random characters)");
        return;
      }
    }

    try {
      setLoading(true);

      const imageUrls: string[] = [];

      for (const file of formFiles) {
        const resizedBlob = await resizeImage(file);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const fileExt = file.type.split("/")[1] || "jpg";

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("photos")
          .upload(`public/${fileName}.${fileExt}`, resizedBlob, {
            contentType: file.type,
          });

        if (uploadError) throw uploadError;

        imageUrls.push(
          `${supabaseUrl}/storage/v1/object/public/photos/${uploadData.path}`,
        );
      }

      const { data: newPost, error: insertError } = await supabase
        .from("posts")
        .insert({
          name: formName.trim(),
          caption: formCaption.trim() ? JSON.parse(JSON.stringify(formCaption.trim())) : null,
          image_url: imageUrls.length > 0 ? imageUrls[0] : null,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
        })
        .select("id")
        .single();

      console.log("Post created:", newPost, "Error:", insertError);

      if (insertError) throw insertError;

      if (newPost?.id) {
        const myPosts = JSON.parse(localStorage.getItem("myPostIds") || "[]");
        myPosts.push(newPost.id);
        localStorage.setItem("myPostIds", JSON.stringify(myPosts));
      }

      toast.success("Memory shared!");
      router.push("/messages");
    } catch (err) {
      console.error("Error posting:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to share memory";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <header>
        <h1>Share a Memory</h1>
      </header>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit} style={{ marginTop: "2rem" }}>
        {/* Honeypot field - hidden from users */}
        <input
          type="text"
          name="website"
          value={formWebsite}
          onChange={(e) => setFormWebsite(e.target.value)}
          style={{ display: "none" }}
          tabIndex={-1}
          autoComplete="off"
        />

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="name">Your Name</label>
            <input
              id="name"
              type="text"
              maxLength={80}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Your name"
              disabled={loading}
              required
              autoComplete="name"
            />
            <p
              style={{
                fontSize: "0.8rem",
                color: "#999",
                marginTop: "0.25rem",
              }}
            >
              {formName.length}/80 characters
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="caption">Memory or Message</label>
            <textarea
              id="caption"
              maxLength={2000}
              value={formCaption}
              onChange={(e) => setFormCaption(e.target.value)}
              placeholder="Share a memory, message, or story..."
              disabled={loading}
              style={{ minHeight: "120px" }}
            />
            <p
              style={{
                fontSize: "0.8rem",
                color: "#999",
                marginTop: "0.25rem",
              }}
            >
              {formCaption.length}/2000 characters
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="files">Photos (optional, up to 3)</label>
            <input
              id="files"
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.gif,.webp,.heic,.heif"
              disabled={loading}
              onChange={(e) => {
                const newFiles = Array.from(e.target.files || []);
                setFormFiles((prev) => {
                  const combined = [...prev, ...newFiles];
                  if (combined.length > 3) {
                    toast.error("Maximum 3 photos allowed");
                    return prev;
                  }
                  return combined;
                });
              }}
            />
            <div style={{ fontSize: "0.85rem", color: "#999", marginTop: "0.5rem" }}>
              Supported formats: JPG, PNG, GIF, WebP, HEIC
            </div>
          </div>

          {formFiles.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                gap: "0.5rem",
                marginTop: "1rem",
              }}
            >
              {formFiles.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "relative",
                    paddingBottom: "100%",
                    background: "#f0f0f0",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${idx + 1}`}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormFiles(formFiles.filter((_, i) => i !== idx));
                    }}
                    disabled={loading}
                    style={{
                      position: "absolute",
                      top: "2px",
                      right: "2px",
                      background: loading
                        ? "rgba(200,200,200,0.5)"
                        : "rgba(255,0,0,0.7)",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      padding: 0,
                      cursor: loading ? "not-allowed" : "pointer",
                      fontSize: "12px",
                      opacity: loading ? 0.5 : 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              marginTop: "1.5rem",
              alignItems: "stretch",
            }}
          >
            <button type="submit" disabled={loading || !isFormValid()}>
              {loading ? "Sharing..." : "Share Memory"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/messages")}
              style={{ background: "#999" }}
              disabled={loading}
            >
              Cancel
            </button>
            {loading && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "1rem",
                  textAlign: "center",
                }}
              >
                <div style={{ transform: "scale(0.6)" }}>
                  <DuckLoader />
                </div>
                <div style={{ fontSize: "0.9rem" }}>
                  <div>Uploading...</div>
                  <div style={{ fontSize: "0.8rem", color: "#999" }}>
                    Please stay on this page
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
