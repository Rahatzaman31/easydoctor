/**
 * Service Worker Registration
 */

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .catch(err => {
          // Service worker registration failed, continue without it
          console.debug('Service Worker registration failed:', err)
        })
    })
  }
}
