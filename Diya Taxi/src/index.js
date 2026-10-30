import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

import './css/main.css';
import './css/components.css';
import './css/booking.css';
import './css/dashboard.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
