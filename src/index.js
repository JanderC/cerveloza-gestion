import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/tokens.css';
import App from './app.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
document.addEventListener(
  'wheel',
  () => {
    if (document.activeElement && document.activeElement.type === 'number') {
      document.activeElement.blur();
    }
  },
  { passive: true }
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);