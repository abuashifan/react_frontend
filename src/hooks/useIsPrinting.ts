import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

/** `true` selama dialog cetak peramban terbuka, supaya tampilan HP bisa beralih ke tata letak kertas. */
export function useIsPrinting() {
  const [printing, setPrinting] = useState(false)
  useEffect(() => {
    const start = () => flushSync(() => setPrinting(true))
    const end = () => setPrinting(false)
    window.addEventListener('beforeprint', start)
    window.addEventListener('afterprint', end)
    return () => {
      window.removeEventListener('beforeprint', start)
      window.removeEventListener('afterprint', end)
    }
  }, [])
  return printing
}
