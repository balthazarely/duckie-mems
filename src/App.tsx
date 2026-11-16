import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import duckLogo from "./images/duck_image.png";
import { Admin } from "./Admin";
import { Home } from "./Home";
import { Messages } from "./Messages";
import { Gallery } from "./Gallery";
import { SharePage } from "./SharePage";
import "./styles.css";

const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

function AppContent() {
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem("adminLoggedIn") === "true";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminPasswordModal, setAdminPasswordModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const navigate = useNavigate();

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem("adminLoggedIn");
    navigate("/");
  };

  const navStyle: React.CSSProperties = {
    background: "white",
    borderBottom: "1px solid #eee",
    padding: "1rem",
    position: "sticky",
    top: 0,
    zIndex: 100,
  };

  const navContainerStyle: React.CSSProperties = {
    maxWidth: "100%",
    margin: "0 auto",
    padding: "0 1.5rem",
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const navButtonStyle = (isActive: boolean): React.CSSProperties => ({
    background: "transparent",
    color: isActive ? "#333" : "#999",
    border: "none",
    borderBottom: isActive ? "2px solid #333" : "none",
    padding: "0.5rem 0.5rem 0.3rem",
    borderRadius: 0,
    cursor: "pointer",
    fontSize: "0.9rem",
    transition: "all 0.2s",
  });

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Toaster position="bottom-center" reverseOrder={false} />
      <div style={navStyle}>
        <div style={navContainerStyle}>
          {/* Desktop Navigation - Left */}
          <div
            style={{
              display: "none",
              gap: "1rem",
            }}
            className="desktop-nav"
          >
            <Link
              to="/"
              style={{
                textDecoration: "none",
                ...navButtonStyle(window.location.pathname === "/"),
              }}
            >
              Home
            </Link>
            <Link
              to="/messages"
              style={{
                textDecoration: "none",
                ...navButtonStyle(window.location.pathname === "/messages"),
              }}
            >
              Messages
            </Link>
            <Link
              to="/gallery"
              style={{
                textDecoration: "none",
                ...navButtonStyle(window.location.pathname === "/gallery"),
              }}
            >
              Gallery
            </Link>
          </div>

          {/* Logo Button */}
          <button
            onClick={() => navigate("/")}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              marginLeft: "auto",
            }}
            className="logo"
          >
            <img
              src={duckLogo}
              alt="Logo"
              style={{
                height: "32px",
                width: "auto",
              }}
            />
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: "transparent",
              border: "none",
              color: "#333",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: 0,
            }}
            className="mobile-menu-btn"
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 99,
              display: "none",
            }}
            className="mobile-overlay"
          />
        )}

        {/* Mobile Menu Drawer */}
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "250px",
            height: "100vh",
            background: "white",
            boxShadow: mobileMenuOpen ? "2px 0 8px rgba(0,0,0,0.2)" : "none",
            zIndex: 101,
            transform: mobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.3s ease-in-out",
            display: "none",
            flexDirection: "column",
            padding: "1rem 0",
          }}
          className="mobile-menu"
        >
          {/* Mobile Menu Logo */}
          <div
            style={{
              padding: "1rem 1.5rem",
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <img
              src="/duck_image.png"
              alt="Logo"
              style={{
                height: "40px",
                width: "auto",
              }}
            />
          </div>

          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              textDecoration: "none",
              padding: "1rem 1rem 1rem 2rem",
              color: "#333",
              fontSize: "1rem",
              borderBottom: "1px solid #eee",
            }}
          >
            Home
          </Link>
          <Link
            to="/messages"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              textDecoration: "none",
              padding: "1rem 1rem 1rem 2rem",
              color: "#333",
              fontSize: "1rem",
              borderBottom: "1px solid #eee",
            }}
          >
            Messages
          </Link>
          <Link
            to="/gallery"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              textDecoration: "none",
              padding: "1rem 1rem 1rem 2rem",
              color: "#333",
              fontSize: "1rem",
            }}
          >
            Gallery
          </Link>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
          .mobile-menu {
            display: none !important;
          }
          .mobile-overlay {
            display: none !important;
          }
          .logo {
            display: flex !important;
          }
        }
        @media (max-width: 767px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu {
            display: flex !important;
          }
          .mobile-overlay {
            display: block !important;
          }
          .logo {
            display: none !important;
          }
        }
      `}</style>

      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/share" element={<SharePage />} />
          <Route
            path="/admin"
            element={<Admin onLogout={handleAdminLogout} />}
          />
        </Routes>
      </div>

      <div
        style={{
          marginTop: "auto",
          textAlign: "center",
          padding: "1rem",
          color: "#ccc",
          fontSize: "0.8rem",
          borderTop: "1px solid #eee",
          background: "#f3ede6",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => {
            if (isAdmin) {
              navigate("/admin");
            } else {
              setAdminPasswordModal(true);
            }
          }}
          style={{
            background: "transparent",
            color: "#bbb",
            border: "none",
            padding: 0,
            fontSize: "0.75rem",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {isAdmin ? "admin panel" : "admin"}
        </button>
      </div>

      {/* Admin Password Modal */}
      {adminPasswordModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
          onClick={() => {
            setAdminPasswordModal(false);
            setAdminPasswordInput("");
          }}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "8px",
              maxWidth: "400px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: "1rem" }}>Enter Admin Password</h3>
            <input
              type="password"
              value={adminPasswordInput}
              onChange={(e) => setAdminPasswordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (adminPasswordInput === adminPassword) {
                    setIsAdmin(true);
                    localStorage.setItem("adminLoggedIn", "true");
                    setAdminPasswordModal(false);
                    setAdminPasswordInput("");
                    navigate("/admin");
                  } else {
                    alert("Incorrect password");
                    setAdminPasswordInput("");
                  }
                }
              }}
              placeholder="Password"
              style={{
                width: "100%",
                padding: "0.6rem",
                marginBottom: "1rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "1rem",
              }}
              autoFocus
            />
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setAdminPasswordModal(false);
                  setAdminPasswordInput("");
                }}
                style={{
                  background: "#999",
                  color: "white",
                  border: "none",
                  padding: "0.6rem 1rem",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (adminPasswordInput === adminPassword) {
                    setIsAdmin(true);
                    localStorage.setItem("adminLoggedIn", "true");
                    setAdminPasswordModal(false);
                    setAdminPasswordInput("");
                    navigate("/admin");
                  } else {
                    alert("Incorrect password");
                    setAdminPasswordInput("");
                  }
                }}
                style={{
                  background: "#333",
                  color: "white",
                  border: "none",
                  padding: "0.6rem 1rem",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
