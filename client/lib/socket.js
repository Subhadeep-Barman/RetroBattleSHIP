import { io as ioc } from 'socket.io-client';

let socket;
export default function getSocket() {
  if (typeof window === 'undefined') return null;
  if (!socket) {
    var host = window.location.hostname;
    var url = (host ? ('http://' + host + ':8900') : 'http://localhost:8900');
    socket = ioc(url);
  }
  return socket;
} 
