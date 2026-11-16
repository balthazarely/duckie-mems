export function DuckLoader({ withPadding = false }: { withPadding?: boolean } = {}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        ...(withPadding && {
          padding: '3rem 0',
          minHeight: '200px',
        }),
      }}
    >
      <div style={{ position: 'relative', width: '80px', height: '80px' }}>
        {/* Rotating circle */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '3px solid transparent',
            borderTop: '3px solid #d4a574',
            borderRight: '3px solid #d4a574',
            borderRadius: '50%',
            animation: 'spin 2s linear infinite',
          }}
        />

        {/* Pulsating duck */}
        <img
          src="/duck_image.png"
          alt="Loading"
          style={{
            position: 'absolute',
            inset: '10px',
            width: 'calc(100% - 20px)',
            height: 'calc(100% - 20px)',
            objectFit: 'contain',
            filter: 'brightness(0.9)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  )
}
