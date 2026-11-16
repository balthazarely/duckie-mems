export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isLoading = false,
}: {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
}) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001,
      }}
      onClick={!isLoading ? onCancel : undefined}
    >
      <div
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '400px',
          width: '90%',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '1rem' }}>{title}</h3>
        <p style={{ marginBottom: '1.5rem', color: '#555', minHeight: '1.5rem' }}>
          {isLoading ? 'Deleting...' : message}
        </p>

        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-block',
                width: '20px',
                height: '20px',
                border: '2px solid #ddd',
                borderTop: '2px solid #333',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }}
            />
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              background: '#999',
              color: 'white',
              border: 'none',
              padding: '0.6rem 1rem',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              background: '#c33',
              color: 'white',
              border: 'none',
              padding: '0.6rem 1rem',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
