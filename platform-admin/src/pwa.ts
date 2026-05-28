export function registerPWA() {
  if (!import.meta.env.PROD) return

  void import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({ immediate: true })
    })
    .catch((err) => {
      console.warn('[platform-admin] PWA non enregistré:', err)
    })
}
