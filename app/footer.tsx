'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD

export default function Footer() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPasswordModal, setAdminPasswordModal] = useState(false)
  const [adminPasswordInput, setAdminPasswordInput] = useState('')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true'
    setIsAdmin(adminLoggedIn)
  }, [])

  const handleAdminLogin = () => {
    if (adminPasswordInput === adminPassword) {
      setIsAdmin(true)
      localStorage.setItem('adminLoggedIn', 'true')
      setAdminPasswordModal(false)
      setAdminPasswordInput('')
      router.push('/admin')
    } else {
      alert('Incorrect password')
      setAdminPasswordInput('')
    }
  }

  if (!mounted) return null

  return (
    <>
      <div
        style={{
          marginTop: 'auto',
          textAlign: 'center',
          padding: '1rem',
          color: '#ccc',
          fontSize: '0.8rem',
          borderTop: '1px solid #eee',
          background: '#f3ede6',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => {
            if (isAdmin) {
              router.push('/admin')
            } else {
              setAdminPasswordModal(true)
            }
          }}
          style={{
            background: 'transparent',
            color: '#bbb',
            border: 'none',
            padding: 0,
            fontSize: '0.75rem',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {isAdmin ? 'admin panel' : 'admin'}
        </button>
      </div>

      {/* Admin Password Modal */}
      {adminPasswordModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => {
            setAdminPasswordModal(false)
            setAdminPasswordInput('')
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1rem' }}>Enter Admin Password</h3>
            <input
              type="password"
              value={adminPasswordInput}
              onChange={(e) => setAdminPasswordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAdminLogin()
                }
              }}
              placeholder="Password"
              style={{
                width: '100%',
                padding: '0.6rem',
                marginBottom: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
              autoFocus
            />
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => {
                  setAdminPasswordModal(false)
                  setAdminPasswordInput('')
                }}
                style={{
                  background: '#999',
                  color: 'white',
                  border: 'none',
                  padding: '0.6rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdminLogin}
                style={{
                  background: '#333',
                  color: 'white',
                  border: 'none',
                  padding: '0.6rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
