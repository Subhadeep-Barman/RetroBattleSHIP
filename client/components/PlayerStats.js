export default function PlayerStats({ health, maxHealth, playerName = 'Opponent', isMyPlayer = false }) {
  const healthPercent = (health / maxHealth) * 100;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={{ margin: 0 }}>
          {isMyPlayer ? '👤 You' : '👤 ' + playerName}
        </h3>
        <span style={styles.status}>
          {health > 0 ? '🟢 Online' : '🔴 Defeated'}
        </span>
      </div>

      <div style={styles.healthBar}>
        <div style={{
          ...styles.healthFill,
          width: `${healthPercent}%`,
          background: healthPercent > 50 ? '#66bb6a' : healthPercent > 25 ? '#ffa726' : '#ef5350',
        }}></div>
      </div>

      <div style={styles.healthText}>
        <strong>{health}</strong> / {maxHealth} HP
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: '#f9f9f9',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '12px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  status: {
    fontSize: '12px',
    fontWeight: '600',
  },
  healthBar: {
    width: '100%',
    height: '20px',
    background: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  healthFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  healthText: {
    marginTop: '4px',
    fontSize: '12px',
    color: '#666',
  },
};
