import { useEffect, useState } from 'react';
import io from '../lib/socket';
import Link from 'next/link';

export default function Home() {
  const [socket, setSocket] = useState(null);
  const [socketId, setSocketId] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const s = io();
    console.log('Socket instance:', s);
    console.log('Socket connected:', s.connected);
    setSocket(s);

    s.on('connect', () => {
      console.log('Socket connected! ID:', s.id);
      setSocketId(s.id);
    });

    s.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    s.on('roomList', (list) => {
      console.log('Received roomList:', list);
      setRooms(list);
    });

    s.on('roomUpdate', (data) => {
      console.log('Received roomUpdate:', data);
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
      console.log('Join event, redirecting to game:', gameId);
      window.location.href = '/game/' + gameId;
    });

    console.log('Emitting listRooms');
    s.emit('listRooms', (list) => {
      console.log('listRooms callback received:', list);
      setRooms(list);
    });

    return () => {
      console.log('Cleanup: disconnecting socket');
      s.disconnect();
    };
  }, []);

  function createRoom() {
    if (!name || name.trim() === '') {
      alert('Please enter a room name');
      return;
    }
    if (!socket) {
      alert('Socket not connected. Refreshing...');
      window.location.reload();
      return;
    }
    setCreating(true);
    console.log('Creating room with name:', name);
    socket.emit('createRoom', { name: name, capacity: 2 }, (res) => {
      setCreating(false);
      console.log('Create room response:', res);
      if (res && res.success) {
        window.location.href = '/room/' + res.room.id;
      } else {
        alert(res?.error || 'Failed to create room');
      }
    });
  }

  function joinRoom(id) {
    if (!socket) return;
    socket.emit('joinRoom', id, (res) => {
      if (res && res.success) {
        window.location.href = '/room/' + id;
      } else {
        alert(res?.error || 'Failed to join room');
      }
    });
  }

  return (
    <div className="container">
      <h1>BattleBoard Lobby</h1>

      <div className="box">
        <h2>Create Room</h2>
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Enter room name" 
          onKeyPress={(e) => e.key === 'Enter' && !creating && createRoom()}
        />
        <button onClick={createRoom} disabled={creating || !name.trim()}>
          {creating ? 'Creating...' : 'Create Room'}
        </button>
      </div>

      <div className="box">
        <h2>Available Rooms ({rooms.length})</h2>
        {rooms.length === 0 ? (
          <p>No rooms available</p>
        ) : (
          <ul>
            {rooms.map((r) => (
              <li key={r.id}>
                <strong>{r.name}</strong> — {r.playerCount}/{r.capacity} players
                <button onClick={() => joinRoom(r.id)}>Join</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="help">Tip: Create a room and invite a friend to play!</p>
    </div>
  );
}
