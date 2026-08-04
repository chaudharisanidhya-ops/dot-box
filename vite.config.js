export default {
  server: {
    host: true, // Expose dev server on local network
    proxy: {
      '/socket.io': {
        target: 'http://127.0.0.1:3000',
        ws: true, // Enable WebSocket proxying
        changeOrigin: true
      }
    }
  }
};
