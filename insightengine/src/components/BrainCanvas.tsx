'use client'

import { useEffect, useRef } from 'react'

interface Node3D {
  x: number; y: number; z: number
  pulse: number; pulseSpeed: number
}

export default function BrainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
    }
    resize()
    window.addEventListener('resize', resize)

    // --- Build neural nodes on sphere surface ---
    const NODE_COUNT = 200
    const getRadius = () => Math.min(canvas.width, canvas.height) * 0.34

    const nodes: Node3D[] = Array.from({ length: NODE_COUNT }, (_, i) => {
      // Golden-angle Fibonacci sphere for even distribution
      const golden = Math.PI * (3 - Math.sqrt(5))
      const y = 1 - (i / (NODE_COUNT - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const theta = golden * i
      const R = getRadius()
      return {
        x: R * r * Math.cos(theta),
        y: R * y,
        z: R * r * Math.sin(theta),
        pulse: Math.random(),
        pulseSpeed: 0.008 + Math.random() * 0.018,
      }
    })

    // Pre-compute connections (nearby nodes)
    const connections: [number, number][] = []
    const CONNECT_DIST_RATIO = 0.52
    nodes.forEach((a, i) => {
      nodes.forEach((b, j) => {
        if (j <= i) return
        const R = getRadius()
        const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < R * CONNECT_DIST_RATIO) {
          connections.push([i, j])
        }
      })
    })

    let rotY = 0
    let rotX = 0.25

    const project = (nx: number, ny: number, nz: number) => {
      const W = canvas.width, H = canvas.height
      const FOV = Math.min(W, H) * 0.85
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX)
      const x1 = nx * cosY - nz * sinY
      const z1 = nx * sinY + nz * cosY
      const y2 = ny * cosX - z1 * sinX
      const z2 = ny * sinX + z1 * cosX
      const scale = FOV / (FOV + z2)
      return { px: W / 2 + x1 * scale, py: H / 2 + y2 * scale, scale, depth: z2 }
    }

    const frame = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      const R = getRadius()
      nodes.forEach(n => { n.pulse = (n.pulse + n.pulseSpeed) % 1 })

      const proj = nodes.map(n => project(n.x, n.y, n.z))

      // Draw connections back-to-front
      connections
        .map(([i, j]) => ({ i, j, depth: (proj[i].depth + proj[j].depth) / 2 }))
        .sort((a, b) => a.depth - b.depth)
        .forEach(({ i, j, depth }) => {
          const pi = proj[i], pj = proj[j]
          const t = Math.max(0, (depth + R) / (2 * R))
          const pulse = (nodes[i].pulse + nodes[j].pulse) / 2
          const alpha = t * 0.45 * (0.4 + pulse * 0.6)
          ctx.beginPath()
          ctx.moveTo(pi.px, pi.py)
          ctx.lineTo(pj.px, pj.py)
          ctx.strokeStyle = `rgba(139,92,246,${alpha.toFixed(3)})`
          ctx.lineWidth = pi.scale * 0.9
          ctx.stroke()
        })

      // Draw nodes
      proj.forEach((p, i) => {
        const t = Math.max(0, (p.depth + R) / (2 * R))
        const pulse = nodes[i].pulse
        const size = p.scale * (1.8 + pulse * 2.2)
        const alpha = t * (0.55 + pulse * 0.45)

        // Outer glow
        const grd = ctx.createRadialGradient(p.px, p.py, 0, p.px, p.py, size * 4)
        grd.addColorStop(0, `rgba(167,139,250,${(alpha * 0.6).toFixed(3)})`)
        grd.addColorStop(1, 'rgba(167,139,250,0)')
        ctx.beginPath()
        ctx.arc(p.px, p.py, size * 4, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        // Core node
        ctx.beginPath()
        ctx.arc(p.px, p.py, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${180 + Math.floor(pulse * 55)},150,255,${alpha.toFixed(3)})`
        ctx.fill()
      })

      rotY += 0.0028
      animRef.current = requestAnimationFrame(frame)
    }

    frame()

    return () => {
      window.removeEventListener('resize', resize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ background: 'transparent' }}
    />
  )
}
