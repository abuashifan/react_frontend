import { useSyncExternalStore } from 'react'

/** Di bawah `md` (768 px): layar HP. Tablet dan desktop memakai tata letak desktop-like. */
const query = '(max-width: 767px)'

function subscribe(callback: () => void) {
  const media = window.matchMedia(query)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}
