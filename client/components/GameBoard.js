export default function GameBoard({ board = [], onCellClick, isClickable = false, title = 'Board' }) {
  const renderBoard = () => {
    const boardData = board.length === 0 ? Array(10).fill(null).map(() => Array(10).fill(null)) : board;

    return (
      <div>
        <h3>{title}</h3>
        <table style={styles.board}>
          <thead>
            <tr>
              <th></th>
              {Array(10).fill(null).map((_, i) => (
                <th key={i} style={styles.header}>{String.fromCharCode(65 + i)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {boardData.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <th style={styles.header}>{rowIdx + 1}</th>
                {row.map((cell, colIdx) => {
                  let cellContent = '';
                  let cellClass = '';

                  if (cell === 'S') {
                    cellContent = '🚢';
                    cellClass = 'board-ship';
                  } else if (cell === 'H') {
                    cellContent = '💥';
                    cellClass = 'board-hit';
                  } else if (cell === 'M') {
                    cellContent = '💧';
                    cellClass = 'board-miss';
                  }

                  return (
                    <td
                      key={`${rowIdx}-${colIdx}`}
                      className={`board-cell ${cellClass}`}
                      onClick={() => isClickable && onCellClick?.(rowIdx, colIdx)}
                      style={{
                        cursor: isClickable ? 'crosshair' : 'default',
                        ...styles.cell
                      }}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return renderBoard();
}

const styles = {
  board: {
    borderCollapse: 'collapse',
    border: '2px solid #667eea',
    background: 'white',
    marginTop: 8,
  },
  header: {
    background: '#667eea',
    color: 'white',
    padding: '8px',
    textAlign: 'center',
    fontWeight: 'bold',
    width: '32px',
    height: '32px',
  },
  cell: {
    width: '32px',
    height: '32px',
    border: '1px solid #ddd',
    textAlign: 'center',
    lineHeight: '32px',
    fontSize: '18px',
    userSelect: 'none',
  },
};
