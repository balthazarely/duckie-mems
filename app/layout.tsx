import { Lora } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './styles.css'
import Navigation from './navigation'
import Footer from './footer'

const lora = Lora({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={lora.className}>
      <head>
        <title>Annie Memorial</title>
        <meta name="description" content="Share memories and messages" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Toaster
            position="bottom-center"
            reverseOrder={false}
            toastOptions={{
              style: {
                padding: '1rem 1.5rem',
                fontSize: '0.95rem',
                background: '#fafafa',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '6px',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#f0f9f0',
                  color: '#2d5f2d',
                  border: '1px solid #d0e8d0',
                },
                iconTheme: {
                  primary: '#6b9b6b',
                  secondary: '#f0f9f0',
                },
              },
              error: {
                duration: 4000,
                style: {
                  background: '#faf0f0',
                  color: '#8b3a3a',
                  border: '1px solid #e8d0d0',
                },
                iconTheme: {
                  primary: '#c9696b',
                  secondary: '#faf0f0',
                },
              },
            }}
          />
          <Navigation />
          <div style={{ flex: 1 }}>
            {children}
          </div>
          <Footer />
        </div>
      </body>
    </html>
  )
}
