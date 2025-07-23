import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8081, // <--- CRITICAL CHANGE: React dev server runs on a different port
    proxy: {
      // Proxy all requests starting with /api to your Spring Boot backend
      '/api': {
        target: 'http://localhost:8080', // <--- CRITICAL CHANGE: Forward /api requests to the backend
        changeOrigin: true, // Needed for virtual hosted sites
        rewrite: (path) => path.replace(/^\/api/, '/api'), // Keep the /api prefix
        // Optionally, if you want to use the specific IP:
        // target: 'http://192.168.80.216:8080',
      },
      // You might also need to proxy other static content if they are not directly served by Vite
      // For example, if your Spring Boot serves '/images' or '/videos' directly:
      // '/images': {
      //   target: 'http://localhost:8080',
      //   changeOrigin: true,
      // },
      // '/videos': {
      //   target: 'http://localhost:8080',
      //   changeOrigin: true,
      // },
      // '/fonts': {
      //   target: 'http://localhost:8080',
      //   changeOrigin: true,
      // },
    },
  },
  build: {
    // Configure the build output directory to be within Spring Boot's static resources
    outDir: 'build', // Or 'dist' if you prefer, then configure Spring to serve from there
    assetsDir: 'assets', // Subdirectory for assets like images, css, js
    emptyOutDir: true, // Clear the output directory before building
    rollupOptions: {
      input: {
        main: 'index.html', // Your main HTML file
      },
    },
  },
});
