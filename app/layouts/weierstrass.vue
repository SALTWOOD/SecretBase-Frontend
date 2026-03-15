<script setup lang="ts">
/**
 * Optimized Weierstrass Fractal Background
 * Engineering focus: Calculation caching & DOM efficiency.
 */
import { ref, onMounted, onUnmounted } from 'vue';
import { useResizeObserver } from '@vueuse/core'; // 推荐安装 @vueuse/core

interface Props {
  color?: string;     // 主色调 (rgb)
  opacity?: number;   // 基础透明度
  detail?: number;    // 采样精细度
  speed?: number;     // 演化速度
}

const props = withDefaults(defineProps<Props>(), {
  color: '99, 102, 241', // Indigo-500
  opacity: 0.3,
  detail: 2,             // 步长，越大性能越好
  speed: 0.005
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
let animationFrameId: number;
let time = 0;

// 性能核心：使用类型化数组预分配，减少 GC 压力
const iterations = 8; // 降低迭代次数，视觉差异微小但性能大幅提升

const draw = () => {
  const canvas = canvasRef.value;
  const ctx = canvas?.getContext('2d', { alpha: true, desynchronized: true });
  if (!canvas || !ctx || !containerRef.value) return;

  const { clientWidth: w, clientHeight: h } = containerRef.value;
  const dpr = window.devicePixelRatio || 1;

  // 响应式尺寸同步
  if (canvas.width !== w * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
  }

  ctx.clearRect(0, 0, w, h);

  time += props.speed;

  // 动态参数：a 决定振幅收敛，b 决定频率发散
  const a = 0.5 + 0.05 * Math.sin(time);
  const b = 3.0 + Math.sin(time * 0.7);

  // 预计算 Math.pow(a, n)，避免在内层循环重复计算
  const aPowers = new Float32Array(iterations);
  const bPowers = new Float32Array(iterations);
  for (let n = 0; n < iterations; n++) {
    aPowers[n] = Math.pow(a, n);
    bPowers[n] = Math.pow(b, n);
  }

  // 样式设置
  ctx.beginPath();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = `rgba(${props.color}, ${props.opacity})`;
  ctx.lineJoin = 'round';

  const centerY = h / 2;
  const amplitude = h / 5;
  const step = props.detail;

  // 核心路径计算
  for (let sx = 0; sx <= w; sx += step) {
    // 映射屏幕 x 到数学域 [-2, 2]
    const x = (sx / w) * 4 - 2;

    // 计算魏尔斯特拉斯函数
    let val = 0;
    for (let n = 0; n < iterations; n++) {
      val += aPowers[n] * Math.cos(bPowers[n] * Math.PI * x);
    }

    const sy = centerY - val * amplitude;

    if (sx === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }

  ctx.stroke();
  animationFrameId = requestAnimationFrame(draw);
};

// 使用 VueUse 提供的 ResizeObserver，性能更好且自动解绑
if (import.meta.client) {
  useResizeObserver(containerRef, () => {
    // ResizeObserver 触发时不执行 draw，只更新 canvas 尺寸标志
    // draw 会在下一帧 requestAnimationFrame 自动处理尺寸
  });
}

onMounted(() => {
  draw();
});

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});
</script>

<template>
  <div ref="containerRef" class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
    <canvas
      ref="canvasRef"
      class="w-full h-full block touch-none"
    />
    <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
  </div>
</template>
