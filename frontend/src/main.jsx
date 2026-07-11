import React from 'react'
import ReactDOM from 'react-dom/client'
import { Buffer } from 'buffer'
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer
}
import App from './App.jsx'
import './index.css'

// Force unregister all Service Workers to prevent caching issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
