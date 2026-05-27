'use client'
import { useEffect, useRef } from 'react'

export default function Stars() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return
    for (let i = 0; i < 60; i++) {
      const s = document.createElement('div')
      s.className = 'star'
      const size = Math.random() * 3 + 2
      s.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random() * 100}%;
        top:${Math.random() * 100}%;
        animation-delay:${(-Math.random() * 3).toFixed(2)}s;
        animation-duration:${(Math.random() * 2 + 2).toFixed(1)}s;
      `
      container.appendChild(s)
    }
  }, [])

  return <div ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.5 }} aria-hidden />
}
