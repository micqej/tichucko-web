'use client'
import { useEffect, useRef } from 'react'

export default function Stars() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    // Main star field — 110 small twinkling dots
    for (let i = 0; i < 110; i++) {
      const s = document.createElement('div')
      s.className = 'star'
      const size = Math.random() * 2.5 + 1.5
      s.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random() * 100}%;
        top:${Math.random() * 100}%;
        animation-delay:${(-Math.random() * 4).toFixed(2)}s;
        animation-duration:${(Math.random() * 2.5 + 1.8).toFixed(1)}s;
      `
      container.appendChild(s)
    }

    // Accent sparkles — bigger, glowy
    const accents = [
      { char: '✦', size: 13, x: 7,  y: 12 },
      { char: '✧', size: 9,  x: 18, y: 5  },
      { char: '✦', size: 11, x: 85, y: 8  },
      { char: '✧', size: 8,  x: 93, y: 22 },
      { char: '✦', size: 10, x: 52, y: 3  },
      { char: '✧', size: 12, x: 3,  y: 55 },
      { char: '✦', size: 9,  x: 96, y: 60 },
      { char: '✧', size: 11, x: 45, y: 92 },
      { char: '✦', size: 8,  x: 72, y: 88 },
      { char: '✧', size: 10, x: 28, y: 78 },
    ]
    accents.forEach(({ char, size, x, y }, i) => {
      const sp = document.createElement('span')
      sp.textContent = char
      sp.style.cssText = `
        position:absolute;
        left:${x}%;
        top:${y}%;
        font-size:${size}px;
        color:#fff;
        opacity:0;
        animation:twinkle ${(2 + Math.random() * 2).toFixed(1)}s ease-in-out infinite;
        animation-delay:${(-Math.random() * 3).toFixed(2)}s;
        pointer-events:none;
        text-shadow:0 0 8px rgba(255,255,255,.7);
      `
      container.appendChild(sp)
    })
  }, [])

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.65 }}
      aria-hidden
    />
  )
}
