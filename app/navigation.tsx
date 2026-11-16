"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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
    textDecoration: "none",
  });

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

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
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
              href="/"
              style={{
                textDecoration: "none",
                ...navButtonStyle(pathname === "/"),
              }}
            >
              Home
            </Link>
            <Link
              href="/messages"
              style={{
                textDecoration: "none",
                ...navButtonStyle(pathname === "/messages"),
              }}
            >
              Messages
            </Link>
            <Link
              href="/gallery"
              style={{
                textDecoration: "none",
                ...navButtonStyle(pathname === "/gallery"),
              }}
            >
              Gallery
            </Link>
          </div>

          {/* Logo Button */}
          <button
            onClick={() => router.push("/")}
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
              src="/duck_image.png"
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
          <button
            onClick={() => router.push("/")}
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
            <img
              src="/duck_image.png"
              alt="Logo"
              style={{
                height: "24px",
                width: "auto",
              }}
            />
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            onClick={closeMobileMenu}
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
            href="/"
            onClick={closeMobileMenu}
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
            href="/messages"
            onClick={closeMobileMenu}
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
            href="/gallery"
            onClick={closeMobileMenu}
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
    </>
  );
}
