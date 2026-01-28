<template>
  <div class="site-wrapper bg-grid-slate">
    <nav class="nav-bar">
      <UContainer class="flex items-center justify-between h-16">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-bolt-20-solid" class="text-pink-500 w-6 h-6" />
          <span class="text-lg font-bold tracking-tight">Secret Base</span>
        </div>

        <div class="flex items-center gap-4">
          <UButton variant="ghost" color="neutral" icon="i-simple-icons-github" to="https://github.com" target="_blank" />
          <UButton color="primary" to="/dashboard" trailing-icon="i-heroicons-arrow-right-20-solid">
            控制台
          </UButton>
        </div>
      </UContainer>
    </nav>

    <main class="hero-section">
      <div class="hero-glow"></div>

      <UContainer class="text-center">
        <div class="status-badge-ping">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span class="relative rounded-full h-2 w-2 bg-pink-500"></span>
          </span>
          v0.1 Beta Version / 测试版本
        </div>

        <h1 class="hero-title">
          我们正在运行<br />
          <span class="gradient-text">秘密基地服务</span>
        </h1>

        <p class="hero-desc">
          通过 ASP.NET Core 与 Nuxt 4 强力驱动，为您提供安全、稳定的私人服务托管与邀请管理。
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <UButton size="xl" class="px-8" to="/register" trailing-icon="i-heroicons-paper-airplane">
            开始使用
          </UButton>
          <UButton size="xl" color="neutral" variant="ghost" class="px-8 ring-1 ring-slate-800" to="/docs" trailing-icon="i-heroicons-book-open">
            查看文档
          </UButton>
        </div>
      </UContainer>
    </main>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.site-wrapper {
  @apply min-h-screen bg-slate-950 text-white selection:bg-pink-500/30;
}

.nav-bar {
  @apply border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50;
}

.hero-title { @apply text-5xl md:text-7xl font-extrabold tracking-tighter mb-6; }

.hero-section { @apply relative overflow-hidden pt-20 pb-32; }

.hero-glow {
  @apply absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-pink-500/10 blur-[120px] rounded-full -z-10;
}

.hero-desc { @apply max-w-2xl mx-auto text-slate-400 text-lg md:text-xl mb-10 leading-relaxed; }
</style>