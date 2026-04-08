import { useEffect, useRef, useCallback } from 'react'
import { playFireworksSound } from '../lib/fireworksSound'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

const COLORS = [
  '#ff595e',
  '#ffca3a',
  '#8ac926',
  '#1982c4',
  '#6a4c93',
  '#ff6b6b',
  '#ffd166',
  '#06d6a0',
  '#118ab2',
  '#ef476f',
]

interface FireworksProps {
  active: boolean
  duration?: number
  onComplete?: () => void
}

export default function Fireworks({
  active,
  duration = 2500,
  onComplete,
}: FireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const animFrame = useRef(0)
  const startTime = useRef(0)

  const burst = useCallback((cx: number, cy: number) => {
    const count = 40 + Math.floor(Math.random() * 20)
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3
      const speed = 2 + Math.random() * 4
      particles.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 60 + Math.floor(Math.random() * 30),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 2 + Math.random() * 3,
      })
    }
  }, [])

  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    particles.current = []
    startTime.current = Date.now()

    playFireworksSound(duration)

    const launchBursts = () => {
      const w = canvas.width
      const h = canvas.height
      burst(w * 0.3 + Math.random() * w * 0.4, h * 0.2 + Math.random() * h * 0.3)
      burst(w * 0.2 + Math.random() * w * 0.6, h * 0.15 + Math.random() * h * 0.4)
      burst(w * 0.4 + Math.random() * w * 0.2, h * 0.25 + Math.random() * h * 0.2)
    }

    launchBursts()
    const burstInterval = setInterval(launchBursts, 600)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.current = particles.current.filter((p) => p.life > 0)
      for (const p of particles.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05
        p.vx *= 0.99
        p.life -= 1 / p.maxLife
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      if (Date.now() - startTime.current < duration) {
        animFrame.current = requestAnimationFrame(animate)
      } else {
        const fadeOut = () => {
          if (particles.current.length > 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            particles.current = particles.current.filter((p) => p.life > 0)
            for (const p of particles.current) {
              p.x += p.vx
              p.y += p.vy
              p.vy += 0.05
              p.life -= 1 / p.maxLife
              ctx.globalAlpha = Math.max(0, p.life)
              ctx.fillStyle = p.color
              ctx.beginPath()
              ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
              ctx.fill()
            }
            ctx.globalAlpha = 1
            animFrame.current = requestAnimationFrame(fadeOut)
          } else {
            onComplete?.()
          }
        }
        fadeOut()
      }
    }

    animFrame.current = requestAnimationFrame(animate)

    return () => {
      clearInterval(burstInterval)
      cancelAnimationFrame(animFrame.current)
    }
  }, [active, burst, duration, onComplete])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  )
}
