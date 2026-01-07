import { useEffect, useState } from 'react';
import io from '../lib/socket';
import Link from 'next/link';

export default function Home() {
  const [socket, setSocket] = useState(null);
  const [socketId, setSocketId] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const s = io();
    setSocket(s);

    s.on('connect', () => {
      setSocketId(s.id);
      setLoading(false);
    });

    s.on('roomList', (list) => {
      setRooms(list);
      setLoading(false);
    });

    s.on('roomUpdate', (data) => {
      if (Array.isArray(data)) setRooms(data);
      else if (data && data.room) setRooms((prev) => {
        const idx = prev.findIndex(r => r.id === data.room.id);
        if (idx === -1) return [...prev, data.room];
        const copy = prev.slice();
        copy[idx] = data.room;
        return copy;
      });
    });

    s.on('join', (gameId) => {
      window.location.href = '/game/' + gameId;
    });

    s.emit('listRooms', (list) => setRooms(list));

    return () => {
      s.disconnect();
    };
  }, []);

  function createRoom() {
    if (!socket) return;
    setCreating(true);
    setError('');
    
    socket.emit('createRoom', { name: name || 'New Room', capacity: 2 }, (res) => {
      setCreating(false);
      if (res && res.success) {
        window.location.href = '/room/' + res.room.id;
      } else {
        setError(res?.error || 'Failed to create room');
      }
    });
  }

  function joinRoom(id) {
    if (!socket) return;
    setError('');
    socket.emit('joinRoom', id, (res) => {
      if (res && res.success) {
        window.location.href = '/room/' + id;
      } else {
        setError(res?.error || 'Failed to join room');
      }
    });
  }

  return (
    <>
      <div className="header">
        <h1>⚔️ BattleBoard</h1>
        <div>
          {socketId && <span style={{ fontSize: '12px', color: '#999' }}>ID: {socketId.slice(0, 6)}</span>}
        </div>
      </div>

      <div className="container">
        <h2>Create or Join a Game</h2>

        <div className="info-box">
          Welcome to BattleBoard! Create a new room or join an existing one to play battleship with friends.
        </div>

        {error && <div className="info-box error">{error}</div>}

        <div className="form-group">
          <div style={{ flex: 1 }}>
            <label htmlFor="roomName">Room Name</label>
            <input
              id="roomName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Awesome Game"
              onKeyPress={(e) => e.key === 'Enter' && createRoom()}
            />
          </div>
          <button
            onClick={createRoom}
            disabled={creating || !socket}
            style={{ alignSelf: 'flex-end' }}
          >
            {creating ? 'Creating...' : 'Create Room'}
          </button>
        </div>

        <p className="help">💡 Tip: Leave the name empty to auto-generate one</p>

        <h2 style={{ marginTop: 32 }}>Available Rooms ({rooms.length})</h2>

        {loading ? (
          <div className="spinner"></div>
        ) : rooms.length === 0 ? (
          <div className="info-box warning">
            No rooms available. Be the first to create one!
          </div>
        ) : (
          <div className="room-list">
            {rooms.map((r) => (
              <div key={r.id} className="room-item">
                <div className="room-item-info">
                  <h3>{r.name}</h3>
                  <p>
                    👥 Players: <strong>{r.playerCount || 0}/{r.capacity}</strong>
                  </p>
                </div>
                <div className="room-item-actions">
                  <Link href={`/room/${r.id}`}>
                    <button className="btn-secondary">View</button>
                  </Link>
                  <button
                    onClick={() => joinRoom(r.id)}
                    disabled={r.playerCount >= r.capacity}
                  >
                    {r.playerCount >= r.capacity ? 'Full' : 'Join'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="info-box" style={{ marginTop: 32 }}>
          <strong>How to play:</strong>
          <ul style={{ marginTop: 8, paddingLeft: 16 }}>
            <li>Create a room or join an existing one</li>
            <li>Wait for all players to join</li>
            <li>The host can start the game once everyone is ready</li>
            <li>Place your ships strategically and sink your opponent!</li>
          </ul>
        </div>
      </div>
    </>
  );
}
