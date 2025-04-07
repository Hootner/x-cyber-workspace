const setupSocket = (io) => {
    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);
  
      // Join a room for a specific post
      socket.on('joinPost', (postId) => {
        socket.join(postId);
        console.log(`User ${socket.id} joined post room: ${postId}`);
      });
  
      // Handle new comment
      socket.on('newComment', ({ postId, comment }) => {
        io.to(postId).emit('commentAdded', comment);
      });
  
      // Handle new like
      socket.on('newLike', ({ postId, likes }) => {
        io.to(postId).emit('likeUpdated', likes);
      });
  
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  };
  
  module.exports = setupSocket;