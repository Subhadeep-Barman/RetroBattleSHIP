export default function Alert({ type = 'info', message, onDismiss }) {
  if (!message) return null;

  const typeStyles = {
    info: { background: '#e3f2fd', border: '#667eea', color: '#1976d2' },
    success: { background: '#e8f5e9', border: '#388e3c', color: '#1b5e20' },
    warning: { background: '#fff3e0', border: '#f57c00', color: '#e65100' },
    error: { background: '#ffebee', border: '#d32f2f', color: '#b71c1c' },
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div style={{
      ...styles.container,
      background: style.background,
      borderColor: style.border,
      color: style.color,
    }}>
      <div style={styles.content}>
        <span>{message}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={styles.closeButton}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    borderLeft: '4px solid',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: '12px',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0',
    color: 'inherit',
  },
};
