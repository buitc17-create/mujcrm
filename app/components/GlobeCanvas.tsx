'use client';

import { useEffect, useRef } from 'react';

const W = 560, H = 560;
const CX = W / 2, CY = H / 2;
const R = 200;

// Fibonacci-distributed dots — computed once
const DOTS: [number, number, number][] = Array.from({ length: 80 }, (_, i) => {
  const phi = Math.acos(2 * (i / 80) - 1);
  const theta = 2 * Math.PI * i * 0.618033988749;
  return [
    R * Math.sin(phi) * Math.cos(theta),
    -R * Math.cos(phi),
    R * Math.sin(phi) * Math.sin(theta),
  ];
});

const LAT_DEGS = [-72, -54, -36, -18, 0, 18, 36, 54, 72];
const LON_COUNT = 12;
const SEGS = 64;

function rotatePoint(
  x: number, y: number, z: number,
  ry: number, rx: number
): [number, number, number] {
  // Y-axis rotation
  const cosY = Math.cos(ry), sinY = Math.sin(ry);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;
  // X-axis rotation
  const cosX = Math.cos(rx), sinX = Math.sin(rx);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;
  return [CX + x1, CY - y2, z2];
}

export default function GlobeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let ry = 0;
    let rx = 0.3;
    let animId: number;
    let frame = 0;

    const draw = () => {
      animId = requestAnimationFrame(draw);
      frame++;
      if (frame % 2 !== 0) return; // 30 fps

      ctx.clearRect(0, 0, W, H);

      // Outer circle
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.strokeStyle = '#00BFFF';
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.45;
      ctx.stroke();

      // Latitude lines
      for (const deg of LAT_DEGS) {
        const phi = (deg * Math.PI) / 180;
        const y3 = R * Math.sin(phi);
        const r = R * Math.cos(phi);
        ctx.beginPath();
        let first = true;
        for (let j = 0; j <= SEGS; j++) {
          const t = (2 * Math.PI * j) / SEGS;
          const [px, py] = rotatePoint(r * Math.cos(t), y3, r * Math.sin(t), ry, rx);
          if (first) { ctx.moveTo(px, py); first = false; }
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = '#00BFFF';
        ctx.lineWidth = 0.9;
        ctx.globalAlpha = 0.28;
        ctx.stroke();
      }

      // Longitude lines
      for (let i = 0; i < LON_COUNT; i++) {
        const theta = (2 * Math.PI * i) / LON_COUNT;
        ctx.beginPath();
        let first = true;
        for (let j = 0; j <= SEGS; j++) {
          const phi2 = (Math.PI * j) / SEGS;
          const [px, py] = rotatePoint(
            R * Math.sin(phi2) * Math.cos(theta),
            -R * Math.cos(phi2),
            R * Math.sin(phi2) * Math.sin(theta),
            ry, rx
          );
          if (first) { ctx.moveTo(px, py); first = false; }
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = '#00BFFF';
        ctx.lineWidth = 0.9;
        ctx.globalAlpha = 0.28;
        ctx.stroke();
      }

      // Dots
      for (const [x3, y3, z3] of DOTS) {
        const [px, py, pz] = rotatePoint(x3, y3, z3, ry, rx);
        const depth = (pz + R) / (2 * R); // 0 = back, 1 = front
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#00BFFF';
        ctx.globalAlpha = 0.25 + depth * 0.45;
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      ry += 0.0018;
      rx += 0.0004;
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ display: 'block' }}
      aria-hidden="true"
    />
  );
}
