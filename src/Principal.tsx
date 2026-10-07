import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import Aplicacao from './Aplicacao.tsx';
import './Estilos.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js');
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Aplicacao />
  </StrictMode>,
);
