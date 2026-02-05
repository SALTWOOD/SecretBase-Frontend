<template>
  <div class="site-wrapper bg-grid-slate selection:bg-(--ui-primary)/30">
    <nav class="nav-bar">
      <UContainer class="flex items-center justify-between h-16">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-zap"
            class="text-(--ui-primary) w-6 h-6"
          />
          <span
            class="text-lg font-bold tracking-tight text-(--ui-text-highlighted)"
            >Secret Base</span
          >
        </div>

        <div class="flex items-center gap-4">
          <UColorModeButton />
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-simple-icons-github"
            to="https://github.com"
            target="_blank"
          />
          <UButton
            color="primary"
            to="/dashboard"
            trailing-icon="i-lucide-arrow-right"
          >
            控制台
          </UButton>
        </div>
      </UContainer>
    </nav>

    <main class="hero-section">
      <div class="hero-glow opacity-50 dark:opacity-100"></div>

      <UContainer class="text-center">
        <div
          class="status-badge-ping border-(--ui-primary)/20 bg-(--ui-primary)/10 text-(--ui-primary)"
        >
          <span class="relative flex h-2 w-2">
            <span
              class="animate-ping absolute h-full w-full rounded-full bg-(--ui-primary) opacity-75"
            ></span>
            <span
              class="relative rounded-full h-2 w-2 bg-(--ui-primary)"
            ></span>
          </span>
          v0.1 Beta Version / 测试版本
        </div>

        <h1 class="hero-title text-(--ui-text-highlighted)">
          我们正在运行<br />
          <span class="gradient-text">秘密基地服务</span>
        </h1>

        <p class="hero-desc text-(--ui-text-muted)">
          通过 ASP.NET Core 与 Nuxt 4
          强力驱动，为您提供安全、稳定的私人服务托管与邀请管理。
        </p>

        <div
          class="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <UButton
            size="xl"
            class="px-8"
            to="/register"
            trailing-icon="i-lucide-send"
          >
            开始使用
          </UButton>
          <UButton
            size="xl"
            color="neutral"
            variant="ghost"
            class="px-8 border border-(--ui-border)"
            to="/docs"
            trailing-icon="i-lucide-book-open"
          >
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
  /* 背景用变量，确保白天变白 */
  @apply min-h-screen bg-(--ui-bg);
}

.nav-bar {
  /* 磨砂玻璃效果：背景色由 CSS 变量控制，透明度手动混合 */
  @apply border-b border-(--ui-border) sticky top-0 z-50;
  background-color: color-mix(in srgb, var(--ui-bg) 50%, transparent);
  backdrop-filter: blur(12px);
}

.hero-title {
  @apply text-5xl md:text-7xl font-extrabold tracking-tighter mb-6;
}

.hero-section {
  @apply relative overflow-hidden pt-20 pb-32;
}

.hero-glow {
  /* 这里的颜色也用变量 */
  @apply absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full -z-10;
  background-color: var(--ui-primary);
  filter: blur(120px);
  opacity: 0.1;
}
</style>
