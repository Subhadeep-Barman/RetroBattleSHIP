import { io as ioc } from 'socket.io-client';

let socket;
export default function getSocket() {
  if (typeof window === 'undefined') return null;
  if (!socket) {
    var host = window.location.hostname;
    var url = (host ? ('http://' + host + ':8900') : 'http://localhost:8900');
    console.log('Connecting to socket server at:', url);
    socket = ioc(url, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
    
    socket.on('connect', () => {
      console.log('Socket.io connected with ID:', socket.id);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket.io disconnected');
    });
  }
  return socket;
} 
