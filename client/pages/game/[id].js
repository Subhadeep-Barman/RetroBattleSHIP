import { useEffect, useState } from 'react';
import io from '../../lib/socket';

export default function GamePage({ query }) {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    const s = io();
    setSocket(s);

    s.on('update', (state) => setGameState(state));
    s.on('gameover', (won) => alert('Game over. You ' + (won ? 'won!' : 'lost.')));

    return () => s.disconnect();
  }, []);

  return (
    <div className="container">
      <h1>Game</h1>
      <div className="box">
        {gameState ? (
          <pre>{JSON.stringify(gameState, null, 2)}</pre>
        ) : (
          <p>Waiting for server updates...</p>
        )}
      </div>
    </div>
  );
}

