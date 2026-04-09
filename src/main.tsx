import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import LockScreen from './components/LockScreen';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LockScreen>
      <App />
    </LockScreen>
  </StrictMode>
);