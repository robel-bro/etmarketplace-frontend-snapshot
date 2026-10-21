import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // Explicitly set the JSX runtime – helps avoid preamble errors
      jsxRuntime: 'automatic',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Auth & session
      '/login':       'http://localhost:3000',
      '/logout':      'http://localhost:3000',
      '/sign_up':     'http://localhost:3000',
      '/send_otp':    'http://localhost:3000',
      '/verify_otp':  'http://localhost:3000',
      '/session':     'http://localhost:3000',

      // API namespace
      '/api':         'http://localhost:3000',

      // Seller & admin dashboards
      '/seller':      'http://localhost:3000',
      '/admin':       'http://localhost:3000',

      // Core marketplace routes
      '/products':    'http://localhost:3000',
      '/categories':  'http://localhost:3000',
      '/orders':      'http://localhost:3000',
      '/packages':    'http://localhost:3000',
      '/cart':        'http://localhost:3000',
      '/wishlist':    'http://localhost:3000',
      '/checkout':    'http://localhost:3000',
      '/vendor':      'http://localhost:3000',
      '/addresses':   'http://localhost:3000',
      '/comparisons': 'http://localhost:3000',
      '/recently_viewed': 'http://localhost:3000',
      '/messages':    'http://localhost:3000',
      '/conversations':'http://localhost:3000',
      '/reviews':     'http://localhost:3000',
      '/questions':   'http://localhost:3000',
      '/return_requests': 'http://localhost:3000',
      '/bulk_orders': 'http://localhost:3000',
      '/delivery_requests': 'http://localhost:3000',
      '/shipping_rates': 'http://localhost:3000',
      '/price_alerts': 'http://localhost:3000',
      '/notifications':'http://localhost:3000',
      '/search':      'http://localhost:3000',
      '/suggestions': 'http://localhost:3000',
      '/filters':     'http://localhost:3000',
      '/regions':     'http://localhost:3000',
      '/stats':       'http://localhost:3000',

      // Health & internal
      '/up':          'http://localhost:3000',
      '/rails':       'http://localhost:3000',
    },
  },
});