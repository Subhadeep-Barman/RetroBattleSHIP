import { useEffect, useState } from 'react';
import io from '../lib/socket';
import Link from 'next/link';

export default function Home() {
  const [socket, setSocket] = useState(null);
  const [socketId, setSocketId] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    const s = io();
    setSocket(s);

    s.on('connect', () => {
      setSocketId(s.id);
    });

    s.on('roomList', (list) => {
      setRooms(list);
    });

    s.on('roomUpdate', (data) => {
      // data may be list or single room update
      if (Array.isArray(data)) setRooms(data);
      else if (data && data.room) setRooms((prev) => {
        const idx = prev.findIndex(r=>r.id===data.room.id);
        if(idx===-1) return [...prev, data.room];
        const copy = prev.slice(); copy[idx] = data.room; return copy;
      });
    });

    s.on('join', (gameId) => {
      // simple redirect to game page
      window.location.href = '/game/' + gameId;
    });

    s.emit('listRooms', (list)=> setRooms(list));

    return () => {
      s.disconnect();
    };
  }, []);

  function createRoom() {
    if(!socket) return;
    socket.emit('createRoom', {name: name || undefined, capacity: 2}, (res)=>{
      if(res && res.success) {
        window.location.href = '/room/' + res.room.id;
      }
    });
  }

  function joinRoom(id) {
    if(!socket) return;
    socket.emit('joinRoom', id, (res)=>{
      if(res && res.success) {
        window.location.href = '/room/' + id;
      } else {
        alert(res && res.error ? res.error : 'Failed to join');
      }
    });
  }

  return (
    <div className="container">
      <h1>BattleBoard Lobby</h1>

      <div className="create">
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Room name (optional)" />
        <button onClick={createRoom}>Create Room</button>
      </div>

      <h2>Available Rooms</h2>
      <ul>
        {rooms.map(r => (
          <li key={r.id}>
            <strong><Link href={'/room/' + r.id}><a>{r.name}</a></Link></strong> — {r.playerCount}/{r.capacity} players
            <button style={{marginLeft:8}} onClick={()=>joinRoom(r.id)}>Join</button>
          </li>
        ))}
      </ul>

      <p className="help">Tip: The host can press Start in the room view to begin a game.</p>
    </div>
  );
}
