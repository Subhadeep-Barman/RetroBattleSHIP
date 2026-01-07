import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import io from '../../lib/socket';

export default function RoomPage() {
  const router = useRouter();
  const { id } = router.query;
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [socketId, setSocketId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const s = io();
    setSocket(s);

    s.on('connect', () => {
      setSocketId(s.id);
    });

    s.on('roomUpdate', (data) => {
      let r;
      if (Array.isArray(data)) {
        r = data.find(rr => String(rr.id) === String(id));
        if (id && !r) {
          router.push('/');
          return;
        }
      } else if (data && data.room) {
        if (String(data.room.id) === String(id)) r = data.room;
      }
      if (r) {
        setRoom(r);
        setLoading(false);
      }
    });

    s.on('join', (gameId) => {
      router.push('/game/' + gameId);
    });

    s.emit('listRooms', (list) => {
      if (id) {
        const foundRoom = list.find(rr => String(rr.id) === String(id));
        if (foundRoom) {
          setRoom(foundRoom);
          setLoading(false);
        }
      }
    });

    return () => s.disconnect();
  }, [id, router]);

  function startGame() {
    if (!socket || starting) return;
    setStarting(true);
    setError('');

    socket.emit('startGame', Number(id), (res) => {
      setStarting(false);
      if (!res.success) {
        setError(res.error || 'Failed to start game');
      }
    });
  }

  function leave() {
    if (!socket) return;
    socket.emit('leaveRoom', Number(id), (res) => {
      router.push('/');
    });
  }

  if (!id || loading) {
    return (
      <>
        <div className="header">
          <h1>⚔️ BattleBoard</h1>
        </div>
        <div className="container">
          <div className="spinner"></div>
          <p style={{ textAlign: 'center' }}>Loading room...</p>
        </div>
      </>
    );
  }

  if (!room) {
    return (
      <>
        <div className="header">
          <h1>⚔️ BattleBoard</h1>
        </div>
        <div className="container">
          <div className="info-box error">Room not found or was closed.</div>
          <Link href="/">
            <button>Back to Lobby</button>
          </Link>
        </div>
      </>
    );
  }

  const isHost = socketId === room.hostId;
  const canStart = isHost && room.players && room.players.length >= 2;

  return (
    <>
      <div className="header">
        <h1>⚔️ BattleBoard</h1>
        <Link href="/">
          <a>← Back to Lobby</a>
        </Link>
      </div>

      <div className="container">
        <h1>{room.name}</h1>

        {error && <div className="info-box error">{error}</div>}

        <div className="info-box">
          {isHost && <strong>👑 You are the room host</strong>}
          {!isHost && <strong>Waiting for host to start the game...</strong>}
        </div>

        <h2>Players in Room</h2>
        <div className="player-list">
          {room.players && room.players.length > 0 ? (
            room.players.map((playerId, idx) => (
              <div key={playerId} className="player-item">
                <span className="status-indicator status-online"></span>
                <span>Player {idx + 1}</span>
                {playerId === room.hostId && (
                  <span className="player-badge badge-host">HOST</span>
                )}
                {playerId === socketId && (
                  <span className="player-badge badge-you">YOU</span>
                )}
              </div>
            ))
          ) : (
            <p className="help">No players yet...</p>
          )}
        </div>

        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <p style={{ fontSize: '14px', color: '#888' }}>
            👥 <strong>{room.players?.length || 0}/{room.capacity}</strong> players in room
          </p>
          {room.players?.length < room.capacity && (
            <p className="help">Waiting for more players to join...</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          {canStart && (
            <button
              onClick={startGame}
              disabled={starting}
              className="btn-success"
            >
              {starting ? 'Starting...' : '▶️ Start Game'}
            </button>
          )}
          {!canStart && isHost && (
            <button disabled style={{ opacity: 0.5 }}>
              Need 2+ players to start
            </button>
          )}
          <button onClick={leave} className="btn-secondary">
            Leave Room
          </button>
        </div>

        <div className="info-box" style={{ marginTop: 32 }}>
          <strong>Room Info:</strong>
          <ul style={{ marginTop: 8, paddingLeft: 16, fontSize: '14px' }}>
            <li>Room ID: <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>{room.id}</code></li>
            <li>Capacity: <strong>{room.capacity}</strong> players</li>
            <li>Players: <strong>{room.players?.length || 0}</strong></li>
            {isHost && <li>You can start the game once all players have joined!</li>}
          </ul>
        </div>
      </div>
    </>
  );
}