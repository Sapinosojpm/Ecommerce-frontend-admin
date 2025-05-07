import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
  resolve: {
    alias: {
      // Add an alias to resolve "@deck.gl/widgets" if necessary
      '@deck.gl/widgets': '@deck.gl/core/dist/experimental/widgets', // adjust this path if needed
    },
  },
  optimizeDeps: {
    include: [
      '@deck.gl/react', // Make sure this dependency is included in your optimization
      '@deck.gl/core',
      '@deck.gl/widgets'
      // Add other dependencies if necessary
    ],
  },
});
