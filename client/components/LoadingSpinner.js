export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div style={styles.container}>
      <div style={styles.spinner}></div>
      <p style={styles.message}>{message}</p>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  spinner: {
    border: '3px solid #f0f0f0',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    width: '48px',
    height: '48px',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '16px',
  },
  message: {
    color: '#999',
    fontSize: '14px',
  },
};
