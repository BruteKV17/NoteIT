import { useEffect, useRef } from 'react'

export function GreenParticlesBg() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    // Pool of 60 tiny, slow-moving emerald green particles
    const particleCount = 60
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.3 + 0.5, // Very small: 0.5px to 1.8px
      alpha: Math.random() * 0.4 + 0.15,  // Soft opacity: 0.15 to 0.55
      speedX: (Math.random() - 0.5) * 0.2, // Very slow horizontal sway
      speedY: -(Math.random() * 0.25 + 0.08), // Slow upward float
      pulseOffset: Math.random() * Math.PI * 2,
    }))

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      const time = Date.now() * 0.001

      particles.forEach((p) => {
        p.x += p.speedX
        p.y += p.speedY

        // Subtle alpha pulsation
        const pulseAlpha = Math.max(0.1, Math.min(0.6, p.alpha + Math.sin(time + p.pulseOffset) * 0.12))

        // Wrap around boundaries smoothly
        if (p.y < -10) {
          p.y = height + 10
          p.x = Math.random() * width
        }
        if (p.x < -10) p.x = width + 10
        if (p.x > width + 10) p.x = -10

        // Draw core particle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(34, 197, 94, ${pulseAlpha})` // Rich Moss Emerald #22C55E
        ctx.fill()

        // Subtle ambient glow for larger particles
        if (p.radius > 1.1) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(74, 222, 128, ${pulseAlpha * 0.25})`
          ctx.fill()
        }
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-80"
      aria-hidden="true"
    />
  )
}
