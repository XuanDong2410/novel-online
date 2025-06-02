// config/webSocket.config.js
import { Server as SocketIOServer } from 'socket.io';
import { ENV_VARS } from '../config/env.config.js';
import { handleSocketEvents } from '../sockets/handlers.js';

let io;

export function setupWebSocket(server) {

  io = new SocketIOServer(server, {
    cors: {
      origin: ENV_VARS.NODE_ENV === 'development' ? ENV_VARS.ALLOWED_ORIGINS : '*',
      methods: ['GET', 'POST']
    }
  });

  // Middleware xác thực JWT
  io.use(async (socket, next) => {
    const token = socket.handshake.query.token || socket.handshake.auth.token;
    if(!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {

    } catch (error) {
      if(error.name === 'TokenExpiredError'){
        return next(new Error('Authentication error: Access token expired'));
      }
      return next(new Error('Authentication error: ' + error.message));
    }
  })

  // Gọi hàm xử lý sự kiện
  handleSocketEvents(io);

  // Lắng nghe các sự kiện từ client
  return io;
}

// Cho phép import io từ nơi khác để emit
export function getIO() {
  if (!io) throw new Error('Socket.io chưa được khởi tạo!');
  return io;
}
