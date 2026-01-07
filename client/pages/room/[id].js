import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import io from '../../lib/socket';

export default function RoomPage() {
  const router = useRouter();
  const { id } = router.query;
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    const s = io();
    setSocket(s);
    if(!s) return;

    s.on('connect', () => {
      setSocketId(s.id);
    });

    s.on('roomUpdate', (data) => {
      let r;
      if (Array.isArray(data)) {
        r = data.find(rr => String(rr.id) === String(id));
        // If room removed, go back to lobby
        if(id && !r) {
          router.push('/');
          return;
        }
      } else if (data && data.room) {
        if (String(data.room.id) === String(id)) r = data.room;
      }
      if(r) setRoom(r);
    });

    s.on('join', (gameId) => {
      // game started and this client was moved into the game room
      router.push('/game/' + gameId);
    });

    s.emit('listRooms', (list)=>{
      if(id) setRoom(list.find(rr=>String(rr.id) === String(id)));
    });

    return () => s.disconnect();
  }, [id]);

  function startGame() {
    if(!socket) return;
    socket.emit('startGame', Number(id), (res)=>{
      if(!res.success) alert(res.error || 'Failed to start');
    });
  }

  function leave() {
    if(!socket) return;
    socket.emit('leaveRoom', Number(id), (res)=>{
      router.push('/');
    });
  }

  if(!id) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <h1>Room {id}</h1>
      {room ? (
        <div>
          <p><strong>{room.name}</strong></p>
          <p>Players ({room.players.length}/{room.capacity}):</p>
          <ul>
            {room.players.map(p => (
              <li key={p}>{p}{p === room.hostId ? ' (host)' : ''}{p === socketId ? ' (you)' : ''}</li>
            ))}
          </ul>

          <div style={{marginTop:12}}>
            {socketId && room.hostId === socketId && room.players.length >= 2 && (
              <button onClick={startGame}>Start Game</button>
            )}
            <button style={{marginLeft:8}} onClick={leave}>Leave Room</button>
          </div>
        </div>
      ) : (
        <p>Room not found or loading...</p>
      )}
    </div>
  );
}