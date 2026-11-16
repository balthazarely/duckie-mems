import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Lightbox } from "./Lightbox";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface GalleryPhoto {
  id: string;
  image_url: string;
  caption: string | null;
}

interface Post {
  id: string;
  created_at: string;
  name: string;
  image_url: string | null;
  image_urls: string[] | null;
}

export function Gallery() {
  const [familyPhotos, setFamilyPhotos] = useState<GalleryPhoto[]>([]);
  const [userPhotos, setUserPhotos] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"family" | "shared">("family");
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
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: familyData } = await supabase
        .from("gallery_photos")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .or("image_url.not.is.null,image_urls.not.is.null")
        .order("created_at", { ascending: false });

      setFamilyPhotos(familyData || []);
      setUserPhotos(postsData || []);
    } catch (err) {
      setError("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  }

  const MasonryGrid = ({
    photos,
    onImageClick,
  }: {
    photos: any[];
    onImageClick: (images: string[], idx: number) => void;
  }) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: "1rem",
        marginTop: "1rem",
      }}
    >
      {photos.map((photo, idx) => (
        <button
          key={photo.id}
          onClick={() => {
            const images = photos.map((p) => p.image_url);
            onImageClick(images, idx);
          }}
          style={{
            overflow: "hidden",
            borderRadius: "4px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            textAlign: "left",
          }}
        >
          <img
            src={photo.image_url}
            alt={photo.caption || photo.name || "photo"}
            style={{
              width: "100%",
              height: "150px",
              objectFit: "cover",
              display: "block",
            }}
          />
          {(photo.caption || photo.name) && (
            <div
              style={{
                padding: "0.5rem",
                fontSize: "0.8rem",
                color: "#555",
                background: "#f9f9f9",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {photo.caption && (
                <span style={{ marginRight: "0.3rem" }}>👤</span>
              )}
              {photo.caption || photo.name}
            </div>
          )}
        </button>
      ))}
    </div>
  );

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    background: isActive ? "#333" : "transparent",
    color: isActive ? "white" : "#666",
    border: isActive ? "none" : "1px solid #ddd",
    padding: "0.6rem 1rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.95rem",
  });

  return (
    <div className="container">
      <header>
        <h1>Photo Gallery</h1>
      </header>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading gallery...</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
            <button
              onClick={() => setActiveTab("family")}
              style={tabButtonStyle(activeTab === "family")}
            >
              Photos
            </button>
            <button
              onClick={() => setActiveTab("shared")}
              style={tabButtonStyle(activeTab === "shared")}
            >
              Shared Photos
            </button>
          </div>

          {activeTab === "family" ? (
            familyPhotos.length > 0 ? (
              <MasonryGrid
                photos={familyPhotos}
                onImageClick={(images, idx) =>
                  setLightbox({
                    isOpen: true,
                    images,
                    initialIndex: idx,
                  })
                }
              />
            ) : (
              <div className="loading">No family photos yet.</div>
            )
          ) : (
            <>
              {userPhotos.length > 0 ? (
                <MasonryGrid
                  photos={userPhotos.flatMap((post) => {
                    const images =
                      post.image_urls && post.image_urls.length > 0
                        ? post.image_urls
                        : post.image_url
                          ? [post.image_url]
                          : [];
                    return images.map((url) => ({
                      id: `${post.id}-${url}`,
                      image_url: url,
                      caption: post.name,
                      created_at: post.created_at,
                    }));
                  })}
                  onImageClick={(images, idx) => {
                    setLightbox({
                      isOpen: true,
                      images,
                      initialIndex: idx,
                    })
                  }}
                />
              ) : (
                <div className="loading">No shared photos yet.</div>
              )}
            </>
          )}

          <Lightbox
            isOpen={lightbox.isOpen}
            images={lightbox.images}
            initialIndex={lightbox.initialIndex}
            onClose={() =>
              setLightbox({ isOpen: false, images: [], initialIndex: 0 })
            }
          />
        </>
      )}
    </div>
  );
}
