import React from 'react';
import ReactDOM from 'react-dom/client';
import { Router } from './router';
import './assets/styles/global.css';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
