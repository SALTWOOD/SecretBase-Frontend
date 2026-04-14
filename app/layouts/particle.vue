<script setup lang="ts">
/**
 * Advanced Minimal Canvas Nest
 * - No Mouse Interaction for Max Performance
 * - Configurable Velocity & Breathing Pulse
 */
import { onMounted, onUnmounted, ref, shallowRef } from "vue";

interface Props {
  count?: number;
  opacity?: number;
  color?: string; // Format: "r,g,b"
  dist?: number; // Connection max distance squared
  speed?: number; // Velocity multiplier
  pulse?: boolean; // Enable breathing effect
  pulseSpeed?: number; // Sine wave speed for pulse
}

const props = withDefaults(defineProps<Props>(), {
  count: 400,
  opacity: 0.9,
  color: "100, 100, 100",
  dist: 4500,
  speed: 1.25,
  pulse: true,
  pulseSpeed: 0.02,
});

const containerRef = ref<HTMLElement | null>(null);
const canvasRef = shallowRef<HTMLCanvasElement | null>(null);

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

let points: Point[] = [];
let animationId: number;
let frameTime = 0;

const initPoints = (w: number, h: number) => {
  points = Array.from({ length: props.count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 1.5 * props.speed,
    vy: (Math.random() - 0.5) * 1.5 * props.speed,
  }));
};

const draw = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update animation timing for pulse
  frameTime += props.pulseSpeed;
  const dynamicOpacity = props.pulse
    ? props.opacity * (0.6 + Math.sin(frameTime) * 0.4)
    : props.opacity;

  const len = points.length;
  for (let i = 0; i < len; i++) {
    const p = points[i]!;
    p.x += p.vx;
    p.y += p.vy;

    // Boundary bounce
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    // Render Point
    ctx.fillStyle = `rgba(${props.color}, ${dynamicOpacity})`;
    ctx.fillRect(p.x, p.y, 1, 1);

    // Connections
    for (let j = i + 1; j < len; j++) {
      const p2 = points[j]!;
      const dx = p.x - p2.x;
      const dy = p.y - p2.y;
      const d2 = dx * dx + dy * dy;

      if (d2 < props.dist) {
        const alpha = (props.dist - d2) / props.dist;
        ctx.strokeStyle = `rgba(${props.color}, ${alpha * dynamicOpacity})`;
        ctx.lineWidth = alpha / 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  }

  animationId = requestAnimationFrame(draw);
};

let resizeObserver: ResizeObserver;

onMounted(() => {
  if (!containerRef.value) return;
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:absolute;top:0;left:0;pointer-events:none;z-index:0;";
  containerRef.value.appendChild(canvas);
  canvasRef.value = canvas;

  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      canvas.width = entry.contentRect.width;
      canvas.height = entry.contentRect.height;
      initPoints(canvas.width, canvas.height);
    }
  });
  resizeObserver.observe(containerRef.value);
  draw();
});

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId);
  resizeObserver?.disconnect();
});
</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full h-full min-h-screen overflow-hidden bg-transparent"
  >
    <div class="relative z-10">
      <slot />
    </div>
  </div>
</template>
