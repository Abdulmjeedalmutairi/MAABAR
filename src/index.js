import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
/* خلفية معبر الثابتة */
.page-bg {
  position: fixed;
  inset: 0;
  background-image: url('https://utzalmszfqfcofywfetv.supabase.co/storage/v1/object/public/hero-image/hero.png');
  background-size: cover;
  background-position: center;
  z-index: -1;
}

.page-bg-overlay {
  position: fixed;
  inset: 0;
  background: rgba(250, 248, 244, 0.92);
  z-index: -1;
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
