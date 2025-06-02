export function handleSocketEvents(io) {
    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}, User: ${socket.user._id}, Role: ${socket.user.role}`);

        // Xử lý sự kiện ping
        socket.on('ping', () => {
            socket.emit('pong', { userId: socket.user._id, role: socket.user.role });
        });

        // Xử lý sự kiện tham gia room
        socket.on('joinRoom', (room) => {
            if(['admin', 'moderator', 'system'].includes(socket.user.role)) {
                socket.join(room);
                socket.emit('roomJoined', { room, message: `Joined room ${room}` });
            } else {
                socket.emit('error', { message: 'Unauthorized to join room' });
            }
        });

        // Xử lý sự kiện disconnect
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}, User: ${socket.user._id}, Role: ${socket.user.role}`);
        })
    })
}