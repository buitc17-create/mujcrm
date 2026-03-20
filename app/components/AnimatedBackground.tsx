'use client';

import { useEffect, useRef } from 'react';

interface Curve {
  points: { x: number; y: number }[];
  velocities: { x: number; y: number }[];
  color: string;
  opacity: number;
  width: number;
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.body.scrollHeight;
    };
    resize();

    const CYAN = '#00BFFF';
    const PURPLE = '#7B2FFF';

    // Each curve is defined by 4 control points (cubic bezier)
    const curves: Curve[] = Array.from({ length: 12 }, (_, i) => {
      const color = i % 2 === 0 ? CYAN : PURPLE;
      const h = canvas.height;
      const w = canvas.width;
      return {
        points: [
          { x: Math.random() * w, y: Math.random() * h },
          { x: Math.random() * w, y: Math.random() * h },
          { x: Math.random() * w, y: Math.random() * h },
          { x: Math.random() * w, y: Math.random() * h },
        ],
        velocities: Array.from({ length: 4 }, () => ({
          x: (Math.random() - 0.5) * 0.4,
          y: (Math.random() - 0.5) * 0.3,
        })),
        color,
        opacity: 0.06 + Math.random() * 0.06,
        width: 1 + Math.random() * 1.2,
      };
    });

    let animId: number;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (const curve of curves) {
        // Move control points
        for (let i = 0; i < 4; i++) {
          curve.points[i].x += curve.velocities[i].x;
          curve.points[i].y += curve.velocities[i].y;
          // Bounce off edges
          if (curve.points[i].x < 0 || curve.points[i].x > w) {
            curve.velocities[i].x *= -1;
          }
          if (curve.points[i].y < 0 || curve.points[i].y > h) {
            curve.velocities[i].y *= -1;
          }
        }

        const [p0, p1, p2, p3] = curve.points;

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        ctx.strokeStyle = curve.color;
        ctx.globalAlpha = curve.opacity;
        ctx.lineWidth = curve.width;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      resize();
    };
    window.addEventListener('resize', handleResize);

    // Re-measure height on scroll (for dynamic content)
    const ro = new ResizeObserver(resize);
    ro.observe(document.body);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
