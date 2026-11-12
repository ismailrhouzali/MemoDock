import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

// Immediate enforcement of popup window bounds for Chromium
if (
  window.location.pathname.includes('popup.html') ||
  document.documentElement.classList.contains('is-popup') ||
  document.body.classList.contains('is-popup')
) {
  const forceDimensions = () => {
    document.documentElement.style.width = '760px';
    document.documentElement.style.minWidth = '760px';
    document.documentElement.style.maxWidth = '760px';
    document.documentElement.style.height = '580px';
    document.documentElement.style.minHeight = '580px';
    document.documentElement.style.maxHeight = '580px';
    document.body.style.width = '760px';
    document.body.style.minWidth = '760px';
    document.body.style.maxWidth = '760px';
    document.body.style.height = '580px';
    document.body.style.minHeight = '580px';
    document.body.style.maxHeight = '580px';
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.style.width = '760px';
      rootEl.style.minWidth = '760px';
      rootEl.style.maxWidth = '760px';
      rootEl.style.height = '580px';
      rootEl.style.minHeight = '580px';
      rootEl.style.maxHeight = '580px';
    }
  };
  forceDimensions();
  window.addEventListener('DOMContentLoaded', forceDimensions);
  setTimeout(forceDimensions, 0);
  setTimeout(forceDimensions, 50);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

