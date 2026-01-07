import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import io from '../../lib/socket';

export default function GamePage() {
  const router = useRouter();
  const { id } = router.query;
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [myBoard, setMyBoard] = useState([]);
  const [opponentBoard, setOpponentBoard] = useState([]);
  const [gameStatus, setGameStatus] = useState('');
  const [currentTurn, setCurrentTurn] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [error, setError] = useState('');
  const [selectedCell, setSelectedCell] = useState(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!id) return;

    const s = io();
    setSocket(s);

    s.on('connect', () => {
      setMyPlayerId(s.id);
    });

    s.on('update', (state) => {
      setGameState(state);
      setGameStatus(state.status || 'Playing');
      setCurrentTurn(state.currentTurn);
      
      // Update boards based on game state
      if (state.myBoard) setMyBoard(state.myBoard);
      if (state.opponentBoard) setOpponentBoard(state.opponentBoard);
    });

    s.on('gameover', (data) => {
      setGameStatus(data.won ? 'You Won! 🎉' : 'You Lost 😢');
      setError(data.message || '');
    });

    s.on('error', (msg) => {
      setError(msg);
    });

    return () => s.disconnect();
  }, [id]);

  const isMyTurn = currentTurn === myPlayerId;

  const handleCellClick = (row, col) => {
    if (!isMyTurn) {
      setError('Not your turn!');
      return;
    }

    if (socket) {
      socket.emit('attack', { row, col, gameId: id }, (res) => {
        if (!res.success) {
          setError(res.error || 'Attack failed');
        } else {
          setSelectedCell(null);
        }
      });
    }
  };

  const createBoard = () => {
    return Array(10)
      .fill(null)
      .map(() => Array(10).fill(null));
  };

  const renderBoard = (board, isOpponent = false) => {
    if (!board || board.length === 0) {
      board = createBoard();
    }

    return (
      <div style={{ marginTop: 16 }}>
        <table style={styles.board}>
          <thead>
            <tr>
              <th></th>
              {Array(10)
                .fill(null)
                .map((_, i) => (
                  <th key={i}>{String.fromCharCode(65 + i)}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {board.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <th>{rowIdx + 1}</th>
                {row.map((cell, colIdx) => {
                  let cellContent = '';
                  let cellClass = '';
                  let isHit = false;
                  let isMiss = false;

                  if (cell === 'S') {
                    cellContent = '🚢';
                    if (!isOpponent) cellClass = 'board-ship';
                  } else if (cell === 'H') {
                    cellContent = '💥';
                    cellClass = 'board-hit';
                    isHit = true;
                  } else if (cell === 'M') {
                    cellContent = '💧';
                    cellClass = 'board-miss';
                    isMiss = true;
                  }

                  return (
                    <td
                      key={`${rowIdx}-${colIdx}`}
                      className={`board-cell ${cellClass}`}
                      onClick={() => isOpponent && handleCellClick(rowIdx, colIdx)}
                      style={{
                        cursor: isOpponent && isMyTurn ? 'crosshair' : 'default',
                        opacity: isOpponent && (isHit || isMiss) ? 0.8 : 1,
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

  if (!id) {
    return (
      <>
        <div className="header">
          <h1>⚔️ BattleBoard</h1>
        </div>
        <div className="container">
          <div className="spinner"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="header">
        <h1>⚔️ BattleBoard - Game</h1>
        <Link href="/">
          <a>← Exit Game</a>
        </Link>
      </div>

      <div className="container">
        {error && <div className="info-box error">{error}</div>}

        <div style={styles.statusBar}>
          <div>
            <h3 style={{ margin: 0 }}>
              {gameStatus === 'Playing'
                ? isMyTurn
                  ? '🎯 Your Turn!'
                  : '⏳ Opponent\'s Turn'
                : gameStatus}
            </h3>
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            Game ID: {id}
          </div>
        </div>

        <div style={styles.boardsContainer}>
          <div style={styles.boardSection}>
            <h2>Your Board</h2>
            <div className="info-box">
              {gameState?.myHealth || 'Loading...'} HP remaining
            </div>
            {renderBoard(myBoard, false)}
          </div>

          <div style={styles.boardSection}>
            <h2>Opponent's Board</h2>
            <div className="info-box">
              {gameState?.opponentHealth || 'Loading...'} HP remaining
            </div>
            {renderBoard(opponentBoard, true)}
            {isMyTurn && <p className="help">Click a cell to attack</p>}
            {!isMyTurn && (
              <p className="help" style={{ color: '#ffa726' }}>
                Waiting for opponent...
              </p>
            )}
          </div>
        </div>

        {gameStatus !== 'Playing' && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <Link href="/">
              <button className="btn-success">Play Again</button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  statusBar: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boardsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px',
    marginTop: '24px',
  },
  boardSection: {
    padding: '16px',
    background: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  board: {
    borderCollapse: 'collapse',
    background: 'white',
    border: '2px solid #667eea',
  },
};

// Add styles for game board cells
if (typeof document !== 'undefined' && !document.getElementById('game-styles')) {
  const style = document.createElement('style');
  style.id = 'game-styles';
  style.innerHTML = `
    .board-cell {
      width: 32px;
      height: 32px;
      border: 1px solid #ddd;
      text-align: center;
      line-height: 32px;
      font-size: 18px;
      user-select: none;
    }

    .board-cell:hover {
      background: #f0f0ff;
    }

    .board-ship {
      background: #c8e6c9;
      font-weight: bold;
    }

    .board-hit {
      background: #ef5350;
    }

    .board-miss {
      background: #90caf9;
    }

    @media (max-width: 1024px) {
      .board-cell {
        width: 28px;
        height: 28px;
        font-size: 14px;
        line-height: 28px;
      }

      [style*="gridTemplateColumns"] {
        grid-template-columns: 1fr !important;
      }
    }
  `;
  document.head.appendChild(style);
}

