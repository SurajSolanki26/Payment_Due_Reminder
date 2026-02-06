import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Debug: print Vite env vars at runtime to help diagnose missing VITE_SUPABASE_URL
console.log('VITE_SUPABASE_URL=', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY=', import.meta.env.VITE_SUPABASE_ANON_KEY ? '***present***' : 'missing');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
