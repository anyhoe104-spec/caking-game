import { Capacitor } from '@capacitor/core'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (!Capacitor.isNativePlatform() && import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
    }).then((reg) => {
      // A build installed on an earlier visit waits for every game window to close, and
      // until then the old worker keeps serving the old images and audio (their URLs never
      // change), so an installed app that is only ever backgrounded never updates them.
      // Swap it in now, at launch, before play starts.
      if (reg.waiting && navigator.serviceWorker.controller) {
        navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
        reg.waiting.postMessage('skipWaiting')
      }
    }).catch(() => {})
  })
}
