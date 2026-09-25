'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';
import { InertiaPlugin } from 'gsap/InertiaPlugin';

gsap.registerPlugin(InertiaPlugin);

const TAU = Math.PI * 2;
const OFFSCREEN = -9999;

const throttle = (func, limit) => {
  let lastCall = 0;
  return function (...args) {
    const now = performance.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func.apply(this, args);
    }
  };
};

function hexToRgb(hex) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

const DotGrid = ({
  dotSize = 16,
  gap = 32,
  baseColor = '#5227FF',
  activeColor = '#5227FF',
  proximity = 150,
  speedTrigger = 100,
  shockRadius = 250,
  shockStrength = 5,
  maxSpeed = 5000,
  resistance = 750,
  returnDuration = 1.5,
  className = '',
  style,
}) => {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const dotsRef = useRef([]);
  const drawRef = useRef(null);
  const frameRef = useRef(0);
  const pointerRef = useRef({
    x: OFFSCREEN,
    y: OFFSCREEN,
    vx: 0,
    vy: 0,
    speed: 0,
    lastTime: 0,
    lastX: 0,
    lastY: 0,
  });

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

  const requestDraw = useCallback(() => {
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      drawRef.current?.();
    });
  }, []);

  const buildGrid = useCallback(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const { width, height } = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);

    const cols = Math.floor((width + gap) / (dotSize + gap));
    const rows = Math.floor((height + gap) / (dotSize + gap));
    const cell = dotSize + gap;

    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;

    const startX = (width - gridW) / 2 + dotSize / 2;
    const startY = (height - gridH) / 2 + dotSize / 2;

    const dots = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        dots.push({ cx: startX + x * cell, cy: startY + y * cell, xOffset: 0, yOffset: 0, _inertiaApplied: false });
      }
    }
    dotsRef.current = dots;
    requestDraw();
  }, [dotSize, gap, requestDraw]);

  useEffect(() => {
    const radius = dotSize / 2;
    const proxSq = proximity * proximity;
    const near = [];

    drawRef.current = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { x: px, y: py } = pointerRef.current;
      near.length = 0;

      ctx.beginPath();
      for (const dot of dotsRef.current) {
        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;
        const dx = dot.cx - px;
        const dy = dot.cy - py;
        const dsq = dx * dx + dy * dy;

        if (dsq <= proxSq) {
          near.push(ox, oy, 1 - Math.sqrt(dsq) / proximity);
        } else {
          ctx.moveTo(ox + radius, oy);
          ctx.arc(ox, oy, radius, 0, TAU);
        }
      }
      ctx.fillStyle = baseColor;
      ctx.fill();

      for (let i = 0; i < near.length; i += 3) {
        const t = near[i + 2];
        const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
        const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
        const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.arc(near[i], near[i + 1], radius, 0, TAU);
        ctx.fill();
      }
    };

    requestDraw();
    return () => {
      drawRef.current = null;
    };
  }, [dotSize, proximity, baseColor, baseRgb, activeRgb, requestDraw]);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  useEffect(() => {
    buildGrid();
    let ro = null;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(buildGrid);
      wrapperRef.current && ro.observe(wrapperRef.current);
    } else {
      window.addEventListener('resize', buildGrid);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', buildGrid);
    };
  }, [buildGrid]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const pushDot = (dot, pushX, pushY) => {
      dot._inertiaApplied = true;
      gsap.killTweensOf(dot);
      gsap.to(dot, {
        inertia: { xOffset: pushX, yOffset: pushY, resistance },
        onUpdate: requestDraw,
        onComplete: () => {
          gsap.to(dot, {
            xOffset: 0,
            yOffset: 0,
            duration: returnDuration,
            ease: 'elastic.out(1,0.75)',
            onUpdate: requestDraw,
          });
          dot._inertiaApplied = false;
        },
      });
    };

    const onMove = (e) => {
      if (e.pointerType === 'touch') return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const now = performance.now();
      const pr = pointerRef.current;
      const hasPrev = pr.lastTime > 0;
      const dt = hasPrev ? now - pr.lastTime : 16;
      let vx = hasPrev ? ((e.clientX - pr.lastX) / dt) * 1000 : 0;
      let vy = hasPrev ? ((e.clientY - pr.lastY) / dt) * 1000 : 0;
      let speed = Math.hypot(vx, vy);
      if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        vx *= scale;
        vy *= scale;
        speed = maxSpeed;
      }
      pr.lastTime = now;
      pr.lastX = e.clientX;
      pr.lastY = e.clientY;
      pr.vx = vx;
      pr.vy = vy;
      pr.speed = speed;

      const rect = canvas.getBoundingClientRect();
      pr.x = e.clientX - rect.left;
      pr.y = e.clientY - rect.top;

      for (const dot of dotsRef.current) {
        const dist = Math.hypot(dot.cx - pr.x, dot.cy - pr.y);
        if (speed > speedTrigger && dist < proximity && !dot._inertiaApplied) {
          pushDot(dot, dot.cx - pr.x + vx * 0.005, dot.cy - pr.y + vy * 0.005);
        }
      }
      requestDraw();
    };

    const onLeave = () => {
      const pr = pointerRef.current;
      pr.x = OFFSCREEN;
      pr.y = OFFSCREEN;
      pr.lastTime = 0;
      requestDraw();
    };

    const onClick = (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      for (const dot of dotsRef.current) {
        const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
        if (dist < shockRadius && !dot._inertiaApplied) {
          const falloff = Math.max(0, 1 - dist / shockRadius);
          pushDot(dot, (dot.cx - cx) * shockStrength * falloff, (dot.cy - cy) * shockStrength * falloff);
        }
      }
    };

    const throttledMove = throttle(onMove, 24);
    window.addEventListener('pointermove', throttledMove, { passive: true });
    window.addEventListener('click', onClick);
    document.documentElement.addEventListener('mouseleave', onLeave);

    return () => {
      window.removeEventListener('pointermove', throttledMove);
      window.removeEventListener('click', onClick);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, [maxSpeed, speedTrigger, proximity, resistance, returnDuration, shockRadius, shockStrength, requestDraw]);

  return (
    <div className={`relative flex h-full w-full items-center justify-center ${className}`} style={style}>
      <div ref={wrapperRef} className="relative h-full w-full">
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
};

export default DotGrid;
