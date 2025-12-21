import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerServiceWorker } from './serviceWorkerRegister'

// Register service worker for offline support and caching
registerServiceWorker()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Signal to prerenderer that the app has finished rendering
if (typeof document !== 'undefined') {
  document.dispatchEvent(new Event('app-rendered'))
}
